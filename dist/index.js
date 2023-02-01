/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 751:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const core = __nccwpck_require__(806);
const { Octokit } = __nccwpck_require__(966);
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

// ************************************************
module.exports = {
  queryIssues,
  formatTitle,
  doIssueComment,
  doRemoveIssueComment,
  removeEmoji,
  checkMentioned,
};


/***/ }),

/***/ 806:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 946:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 966:
/***/ ((module) => {

module.exports = eval("require")("@octokit/rest");


/***/ }),

/***/ 572:
/***/ ((module) => {

module.exports = eval("require")("actions-util");


/***/ }),

/***/ 43:
/***/ ((module) => {

module.exports = eval("require")("compare-similarity");


/***/ }),

/***/ 375:
/***/ ((module) => {

module.exports = eval("require")("dayjs");


/***/ }),

/***/ 868:
/***/ ((module) => {

module.exports = eval("require")("dayjs/plugin/utc");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const core = __nccwpck_require__(806);
const github = __nccwpck_require__(946);

const dayjs = __nccwpck_require__(375);
const utc = __nccwpck_require__(868);
dayjs.extend(utc);

const {
  queryIssues,
  formatTitle,
  doIssueComment,
  checkMentioned,
  doRemoveIssueComment,
} = __nccwpck_require__(751);

const { dealStringToArr } = __nccwpck_require__(572);

const { compare } = __nccwpck_require__(43);

// ************************************************
const context = github.context;

async function run() {
  try {
    const { owner, repo } = context.repo;

    const FIXCOMMENT = `<!-- Created by duplicate issue searcher. Do not remove. -->`;

    if (context.eventName == 'issues') {
      const { number, title, body } = context.payload.issue;

      const sinceDays = core.getInput('since-days');
      const since = dayjs.utc().subtract(sinceDays, 'day').format();

      let issues = await queryIssues(owner, repo, since);

      const filterThreshold = Number(core.getInput('filter-threshold'));

      if (isNaN(filterThreshold) || filterThreshold < 0 || filterThreshold > 1) {
        core.setFailed(
          `[Action][Error] The input "filter-threshold" is ${filterThreshold}. Please keep in [0, 1].`,
        );
        return false;
      }

      const titleExcludes = core.getInput('title-excludes');
      const commentTitle = core.getInput('comment-title');
      const commentBody = core.getInput('comment-body');
      const showMentioned = core.getInput('show-mentioned') || false;

      const formatT = formatTitle(dealStringToArr(titleExcludes), title);

      if (formatT.length == 0) {
        core.info(`[Action][title: ${title}] exclude after empty!`);
        await doRemoveIssueComment(owner, repo, number, FIXCOMMENT);
        return false;
      }

      const result = [];
      issues.forEach(issue => {
        if (issue.pull_request === undefined && issue.number !== number) {
          const formatIssT = formatTitle(dealStringToArr(titleExcludes), issue.title);
          if (formatIssT.length > 0) {
            const similarity = compare(formatIssT, formatT);
            if (
              similarity &&
              similarity >= filterThreshold &&
              checkMentioned(showMentioned, body, issue.number, owner, repo)
            ) {
              result.push({
                number: issue.number,
                title: issue.title,
                similarity: Number(similarity.toFixed(2)),
              });
            }
          }
        }
      });

      core.info(`[Action][filter-issues][length: ${result.length}]`);
      if (result.length > 0) {
        result.sort((a, b) => b.similarity - a.similarity);
        await doIssueComment(owner, repo, number, result, commentTitle, commentBody, FIXCOMMENT);
      } else {
        await doRemoveIssueComment(owner, repo, number, FIXCOMMENT);
      }
    } else {
      core.setFailed(`This action only support on "issues"!`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

})();

module.exports = __webpack_exports__;
/******/ })()
;