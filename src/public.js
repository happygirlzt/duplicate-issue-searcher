const core = require('@actions/core');
const { Octokit } = require('@octokit/rest');
const token = core.getInput('token');
const octokit = new Octokit({ auth: `token ${token}` });

// ************************************************
async function queryIssues(owner, repo, since, page = 1) {
  let { data: issues } = await octokit.issues.listForRepo({
    owner,
    repo,
    state: 'all',
    since,
    per_page: 100,
    page,
  });
  if (issues.length >= 100) {
    issues = issues.concat(await queryIssues(owner, repo, since, page + 1));
  }
  return issues;
}

function formatTitle(excludes, title) {
  if (excludes.length == 0) {
    return title;
  }
  excludes.forEach(ex => {
    title = title.replace(removeEmoji(ex), '');
  });
  return removeEmoji(title.trim()).trim();
}

async function doIssueComment(owner, repo, number, issues, commentTitle, commentBody, FIXCOMMENT) {
  const comments = await listComments(owner, repo, number);
  const filterComments = [];
  comments.forEach(comment => {
    if (comment.body.includes(FIXCOMMENT)) {
      filterComments.push(comment.id);
    }
  });
  if (filterComments.length > 1) {
    core.info(`Error: filterComments length is ${filterComments.length}.`);
    return false;
  }
  const title = commentTitle || `### Issues Similarity Analysis:`;
  let body = '';
  issues.forEach((iss, index) => {
    let similarity;
    if (iss.similarity == 1) {
      similarity = '100';
    } else {
      similarity = (iss.similarity * 100).toString().substring(0, 2);
    }
    if (commentBody) {
      let temp = commentBody;
      temp = temp.replace('${number}', iss.number);
      temp = temp.replace('${title}', iss.title);
      temp = temp.replace('${similarity}', similarity + '%');
      temp = temp.replace('${index}', index + 1);
      body += `${temp}
`;
    } else {
      body += `- [#${iss.number}][${similarity}%]
`;
    }
  });

  const showFooter = core.getInput('show-footer') || 'true';
  const footer =
    showFooter == 'true'
      ? `<sub>🤖 Present by [duplicate issue searcher](https://github.com/happygirlzt/duplicate-issue-searcher)</sub>

${FIXCOMMENT}
`
      : `${FIXCOMMENT}`;

  if (filterComments.length == 0) {
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: number,
      body: title + '\n' + body + '\n' + footer,
    });
    core.info(`Actions: [create-comment][${number}] success!`);
  } else {
    await octokit.issues.updateComment({
      owner,
      repo,
      comment_id: filterComments[0],
      body: title + '\n' + body + '\n' + footer,
    });
    core.info(`Actions: [update-comment][${number}] success!`);
  }
}

async function doRemoveIssueComment(owner, repo, number, FIXCOMMENT) {
  const comments = await listComments(owner, repo, number);
  const filterComments = [];
  comments.forEach(comment => {
    if (comment.body.includes(FIXCOMMENT)) {
      filterComments.push(comment.id);
    }
  });
  if (filterComments.length > 1) {
    core.info(`Error: filterComments length is ${filterComments.length}.`);
    return false;
  } else if (filterComments.length == 1) {
    await octokit.issues.deleteComment({
      owner,
      repo,
      comment_id: filterComments[0],
    });
    core.info(`Actions: [delete-comment][${number}] success!`);
  }
}

async function listComments(owner, repo, number, page = 1) {
  let { data: comments } = await octokit.issues.listComments({
    owner,
    repo,
    issue_number: number,
    per_page: 100,
    page,
  });
  if (comments.length >= 100) {
    comments = comments.concat(await listComments(owner, repo, number, page + 1));
  }
  return comments;
}

function removeEmoji(str) {
  return str.replace(
    /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
    '',
  );
}

function checkMentioned(showMentioned, body, number, owner, repo) {
  if (showMentioned || !body) {
    return true;
  }
  const issueFullLink = `https://github.com/${owner}/${repo}/issues/${number}`;
  const issueSimpleLink = `#${number}`;
  if (body.includes(issueFullLink) || body.includes(issueSimpleLink)) {
    core.info(`[Actions][check-mentioned][${number}] includes, ignore!`);
    return false;
  }
  return true;
}


function bm25f(existingIssue, issue, k1, b, k3, fields) {
  let score = 0;
  let avgDocLength = 0;

  for (const field in fields) {
    // check whether the field is null
    if (!existingIssue[field]) {
      existingIssue[field] = '';
    }
    avgDocLength += existingIssue[field].length;
  }

  avgDocLength /= fields.length;

  for (const term of issue) {
    let fieldScores = [];

    for (const field in fields) {
      if (!existingIssue[field]) {
        existingIssue[field] = '';        
      }
      let fieldLength = existingIssue[field].length;
      
      let termFrequency = existingIssue[field].split(" ").filter(word => word === term).length;
      let numerator = (k1 + 1) * termFrequency;
      let denominator = k1 * ((1 - b) + b * (fieldLength / avgDocLength)) + termFrequency;
      fieldScores.push((numerator / denominator) * (k3 + 1));
    }

    score += Math.max(...fieldScores);
  }

  return score;
}

function findMostSimilarWithCurrentIssue(existingIssues, currentIssue, k1=1.2, b=0.75, k3=8) {
  let scores = [];
  let fields = ['title', 'body'];
  for (const pastIssue of existingIssues) {
    scores.push({
      score: bm25f(pastIssue, currentIssue, k1, b, k3, fields),
      issue_title: pastIssue.title,
      issue_number: pastIssue.number,
      issue_body: pastIssue.body
    });
  }

  scores.sort((a, b) => b.score - a.score);
  // return scores.slice(0, Math.min(5, existingIssues.length)).map(score => score.pastIssue);
  // return {
    // scores: scores.slice(0, Math.min(5, existingIssues.length)),
    // mostSimilarIssues: scores.slice(0, Math.min(5, existingIssues.length)).map(score => score.pastIssue)
  // };
  return scores.slice(0, Math.min(5, existingIssues.length));
}



// ************************************************
module.exports = {
  queryIssues,
  formatTitle,
  doIssueComment,
  doRemoveIssueComment,
  removeEmoji,
  checkMentioned,
  bm25f,
  findMostSimilarWithCurrentIssue
};
