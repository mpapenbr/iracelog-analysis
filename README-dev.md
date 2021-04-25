# How to publish

The package publishing is done by GitHub Actions. See `.github/workflows/publish.yml`

This will be triggered by a new tag. The local actions are as follows:

```
yarn version --[patch|minor|major]
```

If the tests are successful the tag is created and pushed to the repository. GHA will recognize the new tag and start the publish process.
