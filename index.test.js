const fs = require("fs");
const path = require("path");
const action = require("./action");
const tc = require("@actions/tool-cache");
const core = require("@actions/core");
const exec = require("@actions/exec");
//const { url } = require("inspector");

describe("run", () => {
  test("should cache the Linux DEB package for Ubuntu", async () => {
    jest.spyOn(tc, "find").mockReturnValue(undefined);
    jest.spyOn(exec, "getExecOutput").mockReturnValue({ exitCode:1, stdout: '', stderr: '' });
    let downloadTool = jest.spyOn(tc, "downloadTool").mockReturnValue("venafi-csc-24.1.0-x86_64.deb");
    jest.spyOn(tc, "cacheFile").mockReturnValue("/home/sysadmin/actions-runner/_work/_tool/Venafi_CSP/24.1.0/x64/");
    jest.spyOn(fs, "rmSync").mockReturnValue();
    jest.spyOn(exec, "exec").mockReturnValue({ exitCode:0, stdout: '', stderr: '' });;
    jest.spyOn(fs, "chmodSync").mockReturnValue(undefined);
    jest.spyOn(fs, "writeFileSync").mockReturnValue({});
    jest.spyOn(fs, "readdirSync").mockReturnValue(["venafi-csc-24.1.0-x86_64.deb"]);
    jest.spyOn(fs, "statSync").mockReturnValue({
      isDirectory: () => {
        false;
      },
    });
    
    // Act
    await action.run("/_temp/", "Venafi_CSP", "24.1.0", "https://localhost/csc", "https://localhost/vedauth", "https://localhost/vedhsm", "Linux", "ubuntu", "debian", "intel");

    // Restore mocks so the testing framework can use the fs functions
    jest.restoreAllMocks();

    // Assert
    expect(downloadTool).toHaveBeenCalledTimes(1);
  });

  test("should cache the Linux RPM package for Rhel", async () => {
    jest.spyOn(tc, "find").mockReturnValue(undefined);
    jest.spyOn(exec, "getExecOutput").mockReturnValue({ exitCode:1, stdout: '', stderr: '' });
    let downloadTool = jest.spyOn(tc, "downloadTool").mockReturnValue("venafi-csc-24.1.0-x86_64.rpm");
    jest.spyOn(tc, "cacheFile").mockReturnValue("/home/sysadmin/actions-runner/_work/_tool/Venafi_CSP/24.1.0/x64/");
    jest.spyOn(fs, "rmSync").mockReturnValue();
    jest.spyOn(exec, "exec").mockReturnValue({ exitCode:0, stdout: '', stderr: '' });;
    jest.spyOn(fs, "chmodSync").mockReturnValue(undefined);
    jest.spyOn(fs, "writeFileSync").mockReturnValue({});
    jest.spyOn(fs, "readdirSync").mockReturnValue(["venafi-csc-24.1.0-x86_64.rpm"]);
    jest.spyOn(fs, "statSync").mockReturnValue({
      isDirectory: () => {
        false;
      },
    });
    
    // Act
    await action.run("/_temp/", "Venafi_CSP", "24.1.0", "https://localhost/csc", "https://localhost/vedauth", "https://localhost/vedhsm", "Linux", "rhel", "redhat", "intel");

    // Restore mocks so the testing framework can use the fs functions
    jest.restoreAllMocks();

    // Assert
    expect(downloadTool).toHaveBeenCalledTimes(1);
  });

  test("should cache the MSI Installer package & setup script for Windows_NT", async () => {
    jest.spyOn(tc, "find").mockReturnValue(undefined);
    jest.spyOn(exec, "getExecOutput").mockReturnValue({ exitCode:1, stdout: '', stderr: '' });
    let downloadTool = jest.spyOn(tc, "downloadTool").mockReturnValue("venafi-csc-24.1.0-x86_64.msi");
    jest.spyOn(tc, "cacheFile").mockReturnValue("/home/sysadmin/actions-runner/_work/_tool/Venafi_CSP/24.1.0/x64/");
    jest.spyOn(fs, "rmSync").mockReturnValue();
    jest.spyOn(exec, "exec").mockReturnValue({ exitCode:0, stdout: '', stderr: '' });;
    jest.spyOn(fs, "chmodSync").mockReturnValue(undefined);
    jest.spyOn(fs, "writeFileSync").mockReturnValue({});
    jest.spyOn(fs, "readdirSync").mockReturnValue(["venafi-csc-24.1.0-x86_64.bat"]);
    jest.spyOn(fs, "statSync").mockReturnValue({
      isDirectory: () => {
        false;
      },
    });
    
    // Act
    await action.run("C:\temp", "Venafi_CSP", "24.1.0", "https://localhost/csc", "https://localhost/vedauth", "https://localhost/vedhsm", "Windows_NT", "default", "default", "intel");

    // Restore mocks so the testing framework can use the fs functions
    jest.restoreAllMocks();

    // Assert
    expect(downloadTool).toHaveBeenCalledTimes(1);
  });

});

describe("getPackageInfo", () => {
  test("should provide Windows package download information", () => {
    // Act
    let download = action.getPackageInfo("https://localhost/csc/clients", "Windows_NT", "default", "default", "intel", "24.1.0");

    // Assert
    expect(download).toMatchObject( {
      url: "https://localhost/csc/clients/venafi-csc-latest-x86_64.msi",
      savefile: "venafi-csc-24.1.0-x86_64.msi",
      setupfile: "venafi-csc-24.1.0-x86_64.bat"
    });
  });

  test("should provide RPM package download information", () => {
    // Act
    let download = action.getPackageInfo("https://localhost/csc/clients", "Linux", "rhel", "redhat", "intel", "24.1.0");

    // Assert
    expect(download).toMatchObject( {
      url: "https://localhost/csc/clients/venafi-csc-latest-x86_64.rpm",
      savefile: "venafi-csc-24.1.0-x86_64.rpm",
      setupfile: "venafi-csc-24.1.0-x86_64.rpm"
    });
  });

  test("should provide DEB package download information", () => {
    // Act
    let download = action.getPackageInfo("https://localhost/csc/clients", "Linux", "ubuntu", "debian", "intel", "24.1.0");

    // Assert
    expect(download).toMatchObject( {
      url: "https://localhost/csc/clients/venafi-csc-latest-x86_64.deb",
      savefile: "venafi-csc-24.1.0-x86_64.deb",
      setupfile: "venafi-csc-24.1.0-x86_64.deb"
    });
  });

});

describe("extractSemver", () => {

  test("should provide a correct semantic version for simple '24.1.0'", () => {
    // Act
    let semver = action.extractSemver("24.1.0");

    // Assert
    expect(semver).toEqual(
      "24.1"
    );
  });

  test("should provide a correct semantic version for simple '24.1-0.0'", () => {
    // Act
    let semver = action.extractSemver("24.1-0.0");

    // Assert
    expect(semver).toEqual(
      "24.1"
    );
  });

  test("should provide a correct semantic version for simple '24.1.0.1.0.0alpha'", () => {
    // Act
    let semver = action.extractSemver("24.1.0.1.0.0alpha");

    // Assert
    expect(semver).toEqual(
      "24.1"
    );
  });

  test("should provide a correct semantic version with an optional 'v' like 'v24.1.0'", () => {
    // Act
    let semver = action.extractSemver("v24.1.0");

    // Assert
    expect(semver).toEqual(
      "24.1"
    );
  });

  test("Returns an Error when semantic version cannot be extracted from version like 'deploy24.1.0'", () => {
    // Arrange
    expect.assertions(2);

    try {
      // Act
      let semver = action.extractSemver("deloy24.1.0");
    } catch (error) {
      // Restore mocks so the testing framework can use the fs functions
      jest.restoreAllMocks();

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty(
        "message",
        "Failed to extract Semantic version deloy24.1.0"
      );
    }
    });
});

describe("createFile", () => {

  test('successfully writes to file called \'MyScript.bat\' and should have the expected PowerShell execution content', async () => {
    let result = jest.spyOn(fs, "writeFileSync").mockReturnValue({});

    // Act
    await action.createFile("MyScript.bat", "PowerShell --File \"Hello World.ps1\"");

    expect(fs.writeFileSync).toHaveBeenCalledWith("MyScript.bat", "PowerShell --File \"Hello World.ps1\"");
    expect(result).toHaveBeenCalledTimes(1);
  });

});