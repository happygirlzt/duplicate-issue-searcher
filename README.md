## How to use?

```yml
name: Duplicate Issue Searcher

on:
  issues:
    types: [opened, edited]

jobs:
  similarity-analysis:
    runs-on: ubuntu-latest
    steps:
      - name: analysis
        uses: happygirlzt/duplicate-issue-searcher@the-latest-version
        with:
          filter-threshold: 0.5
          title-excludes: 'bug, not, 1234'
          comment-title: '### Potential duplicates'
          comment-body: '${index}. ${similarity} #${number}'
```

## LICENSE

[MIT](./LICENSE)
