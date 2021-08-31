# How to publish

The package publishing is done by GitHub Actions. See `.github/workflows/publish.yml`

This will be triggered by a new tag. The local actions are as follows:

```
yarn release:[patch|minor|major]
```

This will do the following

- increment that version number in `package.json`
- run the tests
- create a tag of the version with prefix `v`
- update the `CHANGELOG.md`

_Note:_ It is important to keep the version in `CHANGELOG.md` and `package.json` in sync. In general, this works out of the box as designed.
We use changelog (https://github.com/lob/generate-changelog) for generating the `CHANGELOG.md `. The github workflow uses https://github.com/ScottBrenner/generate-changelog-action to generate the changelog for the release.

If the tests are successful the tag is created and pushed to the repository. GHA will recognize the new tag and start the publish process.
