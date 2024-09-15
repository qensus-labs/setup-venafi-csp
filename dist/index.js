/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 834:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const fs = __nccwpck_require__(147);
const util = __nccwpck_require__(837);
const path = __nccwpck_require__(17);
const core = __nccwpck_require__(450);
const tc = __nccwpck_require__(454);
const exec = __nccwpck_require__(609);

// Util to create a file with certain content to execute, such as a script. File can be temporary or static.
async function createFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content);
  } catch (exception) {
    throw new Error(
      util.format("Failed to write contents to", filePath),
      core.error(`The following exception occured: ${exception}`)
    );
  }
}

// Utii too extract the '<Major>.<Minor>' version the Semmantic Versioning Convention. Example is '24.1'
function extractSemver(version) {
  var match = version.match(/^v?(\d+)\.(\d+)/);
  if (match) {
    var semver = match[1] + "." + match[2];
    return semver;
  } else {
    throw new Error(
      util.format("Failed to extract Semantic version", version),
    );
  }
}

// Function to uninstall or remove the previous installed Venafi_CSP package.
async function removeVenafiCSP(currentOs, currentDistro, currentFamily, installId) {
  const executeCommand = async (command, args) => {
    const { exitCode, stdout, stderr } = await exec.getExecOutput(command, args, {
      silent: true,
      ignoreReturnCode: true
    });
    core.debug(`removal: exitcode[${exitCode}] with stdout: ${stdout} ${stderr ? `stderr: ${stderr}` : ''}`);
  };

  if (currentOs === 'Linux') {
    if (currentFamily === 'debian') {
      await executeCommand('sudo', ['apt', 'remove', installId, '-y']);
    } else if (currentFamily === 'redhat') {
      await executeCommand('sudo', ['yum', 'remove', installId, '-y']);
    }
  } else if (currentOs === 'Windows_NT' && currentDistro === 'default') {
    await executeCommand('msiexec', ['/qn', '/x', installId]);
  } else if (currentOs === 'Darwin' && currentDistro === 'default') {
    // Requires some work
  } else {
    console.log('Unsupported operating system or distribution detected');
  }
}

// Function to check if a current Venafi_CSP installation exists, checks current installation version, and if needed trigger a reinstall.
async function checkVenafiCSP(tempDir, currentOs, currentDistro, currentFamily, version) {
  const semver = extractSemver(version);
  let localSemver = "";
  let reinstall = true;
  let installId = "venaficodesign";

  const checkInstall = async (command, args) => {
    const { exitCode, stdout, stderr } = await exec.getExecOutput(command, args, {
      silent: true,
      ignoreReturnCode: true
    });
    core.debug(`ExitCode: ${exitCode} StdOut: ${stdout} ${stderr ? `ErrOut: ${stderr}` : ''}`);
    return { exitCode, stdout };
  };

  const parseVersion = (stdout, key) => {
    const lines = stdout.trim().split('\n');
    lines.forEach(item => {
      const [k, ...vParts] = item.toLowerCase().trim().split(':');
      const value = vParts.join(':').trim();
      if (k.trim() === key) {
        core.info(`Detected CSP Driver installation version ${value}`);
        localSemver = extractSemver(value);
      }
    });
  };

  if (currentOs === 'Linux') {
    const commandArgs = currentFamily === 'debian' 
      ? ['apt', 'show', installId] 
      : currentFamily === 'redhat' 
      ? ['yum', 'info', installId] 
      : null;

    if (commandArgs) {
      const { exitCode, stdout } = await checkInstall('sudo', commandArgs);
      if (exitCode === 0) {
        parseVersion(stdout, 'version');
        if (localSemver.match(semver)) {
          core.info(`Matched CSP Driver semantic version ${localSemver}`);
          reinstall = false;
        }
      } else {
        core.info(`Detected no CSP Driver installation`);
      }
    }
  } else if (currentOs === 'Windows_NT' && currentDistro === 'default') {
    const script = `
      Get-ChildItem -Path HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\ |
      Get-ItemProperty | Select-Object DisplayName, DisplayVersion, UninstallString |
      Where-Object {($_.DisplayName -like "*Venafi*Code*Signing*")} | Format-List
    `;
    core.debug(`content: ${script}`);
    await createFile(`${tempDir}\\venafi-csp-check-install.ps1`, script);
    const { exitCode, stdout } = await checkInstall('powershell', [
      "-File",
      `${tempDir}\\venafi-csp-check-install.ps1`
    ]);
    if (exitCode === 0) {
      parseVersion(stdout, 'displayversion');
      if (localSemver.match(semver)) {
        core.info(`Matched CSP Driver semantic version ${localSemver}`);
        reinstall = false;
      }
      const match = stdout.match(/\{[0-9A-Fa-f-]+\}/);
      if (match) installId = match[0];
    }
  } else if (currentOs === 'Darwin' && currentDistro === 'default') {
    // Requires some work
  } else {
    console.log('Unsupported operating system or distribution detected');
  }

  core.debug(`reinstall: ${reinstall}`);
  return { reinstall, installId };
}


// Function that is the core part that installs the Venafi_CSP package
async function installVenafiCSP(cachedToolPath, packageName, currentOs, currentDistro, currentFamily) {
  var packageInstaller;
  var result = "";
  const options = {
    listeners: {
      stdout: (data) => { result += data.toString() }
    }
  }

  if (currentOs == 'Linux' && currentFamily == 'debian' ) {
    packageInstaller = 'dpkg'
    await exec.exec('sudo', [packageInstaller, '-i', util.format("%s/%s",cachedToolPath, packageName) ], options );
  }
  else if (currentOs == 'Linux' && currentFamily == 'redhat' ) {
    packageInstaller = 'rpm'
    await exec.exec('sudo', [packageInstaller, '-Uvh', util.format("%s/%s",cachedToolPath, packageName) ], options );
  }
  else if (currentOs == 'Windows_NT' && currentDistro == 'default') {
    packageInstaller = 'msiexec'
    await exec.exec('powershell', ['Start-Process','-FilePath', util.format("%s\\%s",cachedToolPath, packageName), '-Wait'  ], options );
    // Let's add the default installation path to GITHUB_PATH for the next step to consume.
    core.addPath('C:\\Program Files\\Venafi CodeSign Protect');
  }
  else if (currentOs == 'Darwin' && currentDistro == 'default') {
    packageInstaller = 'installer'
    await exec.exec('sudo', [packageInstaller, '-pkg', '"installer/Venafi CodeSign Protect Clients.pkg/"', '-target', '/' ], options );
  }
  else {
    console.log('Unsupported operating system or distribution detected');
  }
  return result;
}

// Configuration function to configure default parameters for Venafi_CSP platform connectivity. 
async function setDefaultParams(currentOs, authURL, hsmURL) {
  var result = "";
  const options = {
    listeners: {
      stdout: (data) => { result += data.toString() }
    }
  }

  switch (currentOs) {
    case "Linux":
      await exec.exec('pkcs11config', ['seturl',util.format("%s=%s",'--authurl', authURL),util.format("%s=%s",'--hsmurl', hsmURL)] );
      await exec.exec('pkcs11config', ['option','--show'], options );
      break;

    case "Windows_NT":
    default:
      await exec.exec('cspconfig.exe', ['seturl',util.format("%s=%s",'--authurl', authURL),util.format("%s=%s",'--hsmurl', hsmURL)] );
      await exec.exec('cspconfig.exe', ['option','--show'], options );
      break;
  }
  return result;
}

// Function too get the package related information and returns it in a formatted way.
function getPackageInfo(baseURL, currentOs, currentDistro, currentFamily, architecture, version) {
  var url = "";
  var file = "";
  if (currentOs == 'Linux' && currentFamily == 'debian' && architecture == 'intel') {
    file = `venafi-csc-latest-x86_64.deb`;
  }
  else if (currentOs == 'Linux' && currentFamily == 'debian' && architecture == 'arm') {
    file = `venafi-csc-latest-aarch64.deb`;
  }
  else if (currentOs == 'Linux' && currentFamily == 'redhat' && architecture == 'intel') {
    file = `venafi-csc-latest-x86_64.rpm`;
  }
  else if (currentOs == 'Linux' && currentFamily == 'redhat' && architecture == 'arm') {
    file = `venafi-csc-latest-aarch64.rpm`;
  }   
  else if (currentOs == 'Windows_NT' && currentDistro == 'default' && architecture == 'intel') {
    file = `venafi-csc-latest-x86_64.msi`;
  }
  else if (currentOs == 'Darwin' && currentDistro == 'default' && architecture == 'intel') {
    file = `venafi-csc-latest-universal.dmg`;
  }
  else {
    console.log('Unsupported operating system or distribution detected');
  }
  url = util.format("%s/%s", baseURL, file);
  var savefile = file.replace('latest', version);
  var setupfile = file.replace('latest', version);

  if (currentOs == 'Windows_NT') {
     setupfile = setupfile.replace('.msi', '.bat');
  }

  return {
    url: url,
    savefile: savefile,
    setupfile:setupfile
  }
}

// Function which is the core for downloading and caching the initial package. Additional it is the umbrella for other functions.
async function downloadVenafiCSP(tempDir, toolName, baseURL, currentOs, currentDistro, currentFamily, architecture, version) {
  
  // Initial setup or already installed with the correct version?
  const { reinstall, installId }  = await checkVenafiCSP(tempDir, currentOs, currentDistro, currentFamily, version);
  core.debug(`reinstall: ${reinstall}`);
  
  if (reinstall) {
    await removeVenafiCSP(currentOs, currentDistro, currentFamily, installId);
  }

  // Generate all information for the Venafi_CSP downloadTool.
  const download = getPackageInfo(baseURL,currentOs,currentDistro, currentFamily, architecture, version);

  // Maybe the Venafi_CSP package is already cached?
  let cachedToolPath = tc.find(toolName, version);
  core.debug(`find: ${cachedToolPath}`)

  // If the Venafi_CSP package is not available from cache, let's download.
  if (!cachedToolPath) {
    let downloadPath;
    try {
      core.info(`Downloading CSP Driver from ${download.url}...`);
      downloadPath = await tc.downloadTool(download.url, download.savefile);
      core.debug(`downloadTool: ${downloadPath}`);
    } catch (exception) {
      throw new Error(
        util.format("Failed to download CSPDriver from location", download.url),
        core.error(`The following axception occured: ${exception}`)
      );
    }
    
    // Set's temporary permissions for copying over the package.
    fs.chmodSync(downloadPath, "777");

    // Does the actual caching from the downloadPath to the cachingPath.
    cachedToolPath = await tc.cacheFile(downloadPath, download.savefile, toolName, version);
    if (!cachedToolPath) {
      throw new Error(
        util.format("CSP Driver package cannot be cached", cachedToolPath)
      );
    }
    else {
      fs.rmSync(downloadPath);
    }
    
    if (cachedToolPath) {
      var disclaimer = `
      This binary software is the property of Venafi Inc., which is licensed and can be used under license terms. All rights reserved by Venafi Inc.
      See https://venafi.com/terms-of-use/ for more information.
      `
      core.debug(`disclaimer: ${disclaimer}`);
      createFile(util.format("%s/%s",cachedToolPath, "disclaimer.txt"), disclaimer);
    }

    
    
    // This is needed, since the @actions/Toolkit/Caching module checks (using legacy env: %PATHEXT% list) if the tool/package is executable on Windows. This isn' the case for Linux.
    if (currentOs == 'Windows_NT') {
      core.debug(`Setup initialized using batch file`);
      var msiPackage = util.format("%s\\%s",cachedToolPath, download.savefile);
      core.debug(`msipackage: ${msiPackage}`);
      const content = `
      msiexec /qn /i "${msiPackage}"
      `
      core.debug(`content: ${content}`);
      createFile(util.format("%s/%s",cachedToolPath, download.setupfile), content);
    }

    core.debug(`cacheDir: ${cachedToolPath}`);
  }
  
  // Now that we have the install package let's installl this for the currentOs + distribution.
  if (reinstall) {
    var installResults = await installVenafiCSP(cachedToolPath, download.setupfile, currentOs, currentDistro, currentFamily);
    core.debug(`Installation results: ${installResults}`);
  }

  // Now conclude we can find the correct tool/package and if it's executable on Windows.
  const toolPath = findTool(cachedToolPath, download.setupfile);
  core.debug(`toolPath: ${toolPath}`);
  if (!toolPath) {
    throw new Error(
      util.format("CSP Driver package not found in path", cachedToolPath)
    );
  }

  core.info(`CSP Driver installed to ${toolPath}...`);

  // Set the toolPath to 775, since other could start the actions-runner daemon.
  fs.chmodSync(toolPath, "775");

  return toolPath;
}

// Util based on setup-dapr that looks for a cached package and returns the path.
function findTool(rootFolder, packageName) {
  core.info(`Discovery started for ${packageName} ${rootFolder}`);
 
  var fileList;

  // walkSync is recursive which is why we pass in fileList and assign it the
  // return value of this function.
  fileList = walkSync(
    rootFolder,
    fileList,
    packageName
  );

  if (!fileList || fileList.length == 0) {
    throw new Error(
      util.format("CSP Driver executable not found in path", rootFolder)
    );
  } else {
    // Return the first one we find.
    core.info(`Following found ${fileList}`);
    return fileList[0];
  }
}

// Util based on setup-dapr that returns list of path to the fileToFind in the dir provided.
function walkSync(dir, fileList, fileToFind) {
  var files = fs.readdirSync(dir);

  core.debug(`readdirSync: ${files}`);

  fileList = fileList || [];
  files.forEach(function (file) {
    let statsSync = fs.statSync(path.join(dir, file)).isDirectory() 
    core.debug(`statSync: ${statsSync}`);
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      fileList = walkSync(path.join(dir, file), fileList, fileToFind);
    } else {
      core.debug(file);
      if (file == fileToFind) {
        fileList.push(path.join(dir, file));
      }
    }
  });

  return fileList;
}

// The main function of this action. It hooks the actual setup Venafi_CSP functions to more configuration functions.
async function run(tempDir, toolName, version, baseURL, authURL, hsmURL, currentOs, currentDistro, currentFamily, architecture) {
  core.info(`Identified '${currentDistro}' for ${currentFamily} ${currentOs}`);
  
  let cachedPath = await downloadVenafiCSP(tempDir, toolName, baseURL, currentOs, currentDistro, currentFamily, architecture, version);

  if (!process.env["PATH"].startsWith(path.dirname(cachedPath))) {
    core.addPath(path.dirname(cachedPath));
  }

  let cachedConfig

  if (core.getInput('include-config') == 'true') {
    var cachedConfigJson = {};
    cachedConfig = await setDefaultParams(currentOs, authURL, hsmURL);
    var configLines = cachedConfig.match(/^\s*(PKS SERVER URL|HSM SERVER URL|GRANTEE|AUTH SERVER URL|TIMESTAMP SERVER URL|CSC SERVER URL)\s*=\s*(https?:\/\/[^\s]+)\/?$/gm);
    if (configLines) {
      configLines.forEach(line => {
        const [key, value] = line.split('=').map(item => item.trim());
        const jsonKey = key.replace(/\s+/g, '_').toUpperCase();
        cachedConfigJson[jsonKey] = value;
      });
    }
    // set a an output of this action incase future steps need the path to the tool.
    core.setOutput("venafi-csp-cached-version", version);
    core.setOutput("venafi-csp-cached-path", cachedPath);
    core.setOutput("venafi-csp-cached-config", cachedConfigJson);
  }
  else {
    // set a an output of this action incase future steps need the path to the tool.
    core.setOutput("venafi-csp-cached-version", version);
    core.setOutput("venafi-csp-cached-path", cachedPath);
  }
  core.info(`CSP Driver version: '${version}' has been cached at ${cachedPath}`);
}

module.exports = {
  run: run,
  setDefaultParams: setDefaultParams,
  downloadVenafiCSP: downloadVenafiCSP,
  checkVenafiCSP: checkVenafiCSP,
  getPackageInfo: getPackageInfo,
  extractSemver: extractSemver,
  createFile: createFile,
};

/***/ }),

/***/ 450:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 609:
/***/ ((module) => {

module.exports = eval("require")("@actions/exec");


/***/ }),

/***/ 454:
/***/ ((module) => {

module.exports = eval("require")("@actions/tool-cache");


/***/ }),

/***/ 147:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 37:
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ 17:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ 837:
/***/ ((module) => {

"use strict";
module.exports = require("util");

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
const os = __nccwpck_require__(37);
const fs = __nccwpck_require__(147);
const action = __nccwpck_require__(834);
const core = __nccwpck_require__(450);

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
})();

module.exports = __webpack_exports__;
/******/ })()
;