# Maintenance guide

## Releasing a new version

> See also the [internal development notes](https://github.com/qensus-labs/venafi-dev-notes/blob/master/VENAFI-CLIENT-TOOLS.md) to learn how to check for and obtain new Venafi client tools versions.

 1. Bump the version number in `version.txt`.

 2. Bump the versions of existing dependencies in `package.json`.

 3. Add the newest release note (must be a oneliner) in `release-notes.txt`

 4. Run `scripts/publish.sh` and validate if the `version` and `release notes` are well displayed. Continue with Yes.

 5. Ensure the tag is published [as tag](https://github.com/qensus-labs/setup-venafi-csp/tags). 
  
 6. Ensure[the CI](https://github.com/qensus-labs/setup-venafi-csp/actions) is successful.

 7. Create [the release](https://github.com/qensus-labs/setup-venafi-csp/releases)'s notes and finalize the release.

