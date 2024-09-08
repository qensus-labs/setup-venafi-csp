const os = require("os");
const fs = require("fs");
const action = require("./action");
const core = require("@actions/core");

// Variable from Github to asign.
const tempDir = process.env['RUNNER_TEMP'];

// The name of the tool we are installing with this action, which is 'Venafi Code Sign Protect'
const toolName = "Venafi_CSP";

// The architecture of the system to install the package on. Most scenarios 'intel' is applicable.
const architecture = core.getInput('architecture');

// Base form of the the URL to download the release archives. As long as this
// does not change this will be able to download any version the CLI. Additional we request both Auth and HSML URL.
const baseURL = core.getInput('venafi-csc-url') + '/clients';

const authURL = core.getInput('venafi-auth-url');

const hsmURL = core.getInput('venafi-hsm-url');

// This function we determine the applicable distribution of the Linux operating system and sets the default distribution for other operating systems like Windows and MacOS.
function getLinuxDistro(currentOs) {
  let currentDistro = "";
  let currentFamily = "";
  if (currentOs == 'Linux') {
    const debDistrolist = ['ubuntu', 'debian'];
    const rhelDistrolist = ['rhel', 'centos', 'rocky', 'amzn', 'fedora', 'ol'];
    const data = fs.readFileSync('/etc/os-release', 'utf8');
    const lines = data.toString().split('\n');
    const idLine = lines.find(line => line.startsWith('ID='));
    if (idLine) {
      currentDistro = idLine.split('=')[1].replace(/^"(.*)"$/, '$1');
      if (debDistrolist.includes(currentDistro)) {
        currentFamily = 'debian';
      }
      else if (rhelDistrolist.includes(currentDistro)) {
        currentFamily = 'redhat';
      }
      else {
        currentFamily = 'unknown';
      }
    }
  }
  else {
    currentDistro = 'default';
    currentFamily = 'default';
  }
  return {currentDistro, currentFamily};
}

/*
This is how the action is used:

- uses: qensus-labs/venafi-codesigning-wrapper-action@v1
  with:
    version: '<version>' # default is 23.1
  id: install

*/
async function run() {
  try {
    // Get the users input of the with
    const version = core.getInput("venafi-version");
    core.info(`Installing CSP Driver version ${version}...`);

    // debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true
    core.debug(new Date().toTimeString());

    // determine current operating system used by github runner
    const currentOs = os.type();

     // determine current distro and family of the Linux operating system used by the github runner
     const { currentDistro, currentFamily } = getLinuxDistro(currentOs);

    // run the action code
    await action.run(tempDir, toolName, version, baseURL, authURL, hsmURL, currentOs, currentDistro, currentFamily, architecture);

    core.info(new Date().toTimeString());
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();