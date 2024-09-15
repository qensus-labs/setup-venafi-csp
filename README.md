# Setup Venafi CodeSign Protect
This action enables you to download, cache and set the Venafi CodeSign Protect clients either based on `Venafi CSP` or `PKCS#11`.
Optionally you may want to set a `default configuration` for verification purposes.

if you are not familiar with `Code Signing` or `Venafi CodeSign Protect`, please refer to current [CodeSign Protect documentation](https://docs.venafi.com/Docs/current/TopNav/Content/CodeSigning/cco-codesigning-understanding.php) to get an understanding of the benefits and product features.

**Table of contents**

 - [Usage overview](#usage-overview)
 - [Optional Inputs](#optional-inputs)
 - [Expected Outputs](#expected-outputs)
 - [Compatibility](#compatibility)
   - [Considerations using GitHub-hosted runners](#considerations-using-github-hosted-runners)
 - [Usage](#usage)
   - [Example driver setup using minimal parameters](#example-driver-setup-using-minimal-parameters)
   - [Example driver setup including initial configuration](#example-driver-setup-including-initial-configuration)
   - [Example driver setup using Linux including Jarsigner Code Signing flow](#example-driver-setup-using-linux-including-jarsigner-code-signing-flow)
   - [Example driver setup using Windows including Signtool Code Signing flow](#example-driver-setup-using-windows-including-signtool-code-signing-flow)
 - [Contribution & development](#contribution--development)


## Usage overview
This action currently supports GitHub-provided Linux and Windows runners, including self-hosted runners.
Currently we provide examples for `jarsigner` and `signtool`, which are provided through the Python library [Venafi CodeSign Protect: Python (PyPi) Package](https://pypi.org/project/venafi-csp/).

### Optional Inputs
The following optional inputs:

| Input | Description |
| --- | --- |
| `venafi-csc-url` | Venafi CodeSign Protect client Download page, which defaults to `https://localhost/csc` for local development. |
| `venafi-version` | Venafi CodeSign Protect version, which defaults to `24.1.0`, our latest tested version. |
| `venafi-auth-url` | Trust Protection Platform authentication server URL, which defaults to `https://localhost/vedauth` for local development. |
| `venafi-hsm-url` | Trust Protection Platform virtual HSM URL, which defaults to `https://localhost/vedhsm` for local development. |
| `include-config` | Does an initial `set-url` to set the authentication server and virtual HSM URLs, which defaults to `false` for local development. |
| `architecture` | System architecture to provide the corret installation, which defaults to `intel`. Other valid option is `arm`.  |

*Note: Never set the actual password as clear text, but instead register the `password` as **Github Secret**.*

## Expected Outputs
The following outputs:

| Output | Description |
| --- | --- |
| `venafi-csp-cached-config` | Configuration of the cached CSP Driver package. Only if `initial-config` is set to `true`. |
| `venafi-csp-cached-path` | Path of the cached CSP Driver package. |
| `venafi-csp-cached-version` | Version of the cached CSP Driver package. |

Add the following entry to your Github workflow YAML file as bare minimum input.:

```yaml
uses: qensus-labs/setup-venafi-csp@v1.0.0
with:
  version: '24.1.0' # optional
```
## Compatibility

This product is compatible with:

 * Trust Protection Platform 24.1 or later.
 * Venafi CodeSign Protect client tools 24.1 or later.

This product supports executing code signing clients in a Shell environment using the Python `venafi-csp` integration. We currently support Linux and Windows operating systems.

Currently our support differs per OS:

| Signer    | OS      | Venafi-CSP |
|-----------|---------|------------|
| Jarsigner | Linux   |     ✅     |
| Jarsigner | Windows |     ✅     |
| Signtool  | Linux   |     ❌     |
| Signtool  | Windows |     ✅     |

### Considerations using GitHub-hosted runners

`setup-venafi-csp` GitHub Actions can be used for both `GitHub-hosted` or `self-hosted` runners. During development we tested common codesigning scenarios and that the driver is setup correctly, which includes the actual installation and signing activities. Although the `GitHub-hosted` runners do support `public`,  `private` repositories and automatically decommision the VM, some data residu can reside. Because of this potential risk you should understand that it's still running on `shared` infrastructure.

Use cases with low security requirements could benefit `GitHub-hosted` runners. When higher security requirements need to be met, we strongly advice to use `Self-hosted` runnners, which is our default advice to keep your certificates secure.

## Usage

Below various examples how you can implement and integrate `setup-venafi-csp` together with your favorite code signing activities.
The boilerplate code go from initial configuration to full implementation examples using `jarsigner` and `signtool`.

### Example driver setup using minimal parameters

Scenario implements the `default` version with `default` configuration that expects a local setup of `Venafi TPP`.

*Note: It does require a local development environment (TPP) to be well-configured and available. Otherwise you may have to set additional parameters.*

```yaml
jobs:
  example:
    runs-on: ubuntu-latest

    permissions: {}

    name: Example to using defaults with local TPP
    steps:
      - name: Setup Venafi CSP Driver
        uses: qensus-labs/setup-venafi-csp@v1.0.0
      - name: Check Venafi CSP Driver (version)
        run: pkcs11config --version
```


### Example driver setup including initial configuration

Scenario implements a `pinned` version with `minimal configuration`.

```yaml
jobs:
  example:
    runs-on: ubuntu-latest

    permissions: {}

    name: Example including initial configuration
    steps:
      - name: Setup Venafi CSP Driver
        uses: qensus-labs/setup-venafi-csp@v1.0.0
        with:
          venafi-version: '24.1.0'
          venafi-csc-url: 'https://my-tpp/csc'
          venafi-auth-url: 'https://my-tpp/vedauth'
          venafi-hsm-url: 'https://my-tpp/vedhsm'
          include-config: 'true'
      - name: Check Venafi CSP Driver (version)
        run: pkcs11config --version
```


### Example driver setup using Linux including Jarsigner Code Signing flow

Complete implementation of a `pinned` version. Additionally it demostrates a complete Code Signing lifecycle using `jarsigner`.

See the [Venafi CodeSign Protect: Python (PyPi) Package](https://pypi.org/project/venafi-csp/) documentation for more detailed configuration examples and applicable parameters.

*Notes*:
- When using a *shared* runner, only update *runs-on:* parameter value with `ubuntu-latest`.
- More advanced parameters are available at  [Venafi CodeSign Protect: Python (PyPi) Package](https://pypi.org/project/venafi-csp/).

```yaml
jobs:
  example:
    runs-on: ["self-hosted", "Linux", "X64"] # runs-on: ubuntu-latest
    name: Example with self-hosted Linux, executing Jarsigner Code Signing flow
    steps:
      - name: Setup Venafi CSP Driver
        id: cspdriver
        uses: qensus-labs/setup-venafi-csp@v1.0.0
        with:
          venafi-version: '24.1.0'
          venafi-csc-url: 'https://my-tpp/csc'
          venafi-auth-url: 'https://my-tpp/vedauth'
          venafi-hsm-url: 'https://my-tpp/vedhsm'
      - name: Display Venafi CSP Driver Cached Output Variables
        run: |
          echo "Output \"csp-driver-cached-path\" [${{steps.cspdriver.outputs.csp-driver-cached-path}}]"
          echo "Output \"csp-driver-cached-version\" [${{steps.cspdriver.outputs.csp-driver-cached-version}}]"
      - name: Check Venafi CSP Driver (version)
        run: pkcs11config --version
      - name: Setup Java SDK
        uses: actions/setup-java@v4
        with:
          distribution: 'oracle' # See 'Supported distributions' for available options
          java-version: '21'
      - name: Show Jarsigner Version
        run: jarsigner -version
      - name: Build Software Artifact
        run: |
          echo 'public class Foo { public static void main() { } }' > Foo.java
          javac Foo.java
          jar -cf foo.jar Foo.class
      - name: Store Software Artifact
        uses: actions/upload-artifact@v4
        with:
          name: foo.jar
          path: foo.jar
      - name: Setup Python SDK
        uses: actions/setup-python@v5
        with:
          python-version: '3.10'
      - name: Install Venafi CSP Python Package
        run: pip install venafi-csp
      - name: Show Venafi-CSP Package Version
        run: python -mvenafi_csp.version_command
      - name: Sign Artifact with Jarsigner
        run: python -mvenafi_csp.jarsigner_sign_command
        env:
          TPP_AUTH_URL: 'https://my-tpp/vedauth'
          TPP_HSM_URL: 'https://my-tpp/vedhsm'
          TPP_USERNAME: signer
          TPP_PASSWORD: ${{ secrets.TPP_PASSWORD }}
          VENAFI_CLIENT_TOOLS_DIR: '${{ runner.tool_cache }}/CSPDriver/24.1.0/x64/opt/venafi/codesign'
          INPUT_PATH: foo.jar
          CERTIFICATE_LABEL: github-signer-development-codesigner
     - name: Verify Artifact with Jarsigner
        run: python -mvenafi_csp.jarsigner_verify_command
        env:
          TPP_AUTH_URL: 'https://my-tpp/vedauth'
          TPP_HSM_URL: 'https://my-tpp/vedhsm'
          TPP_USERNAME: signer
          TPP_PASSWORD: ${{ secrets.TPP_PASSWORD }}
          INPUT_PATH: foo.jar
          CERTIFICATE_LABEL: github-signer-development-codesigner
      - name: Store Signed Software Artifact
        uses: actions/upload-artifact@v4
        with:
          name: foo-signed.jar
          path: foo.jar
```

### Example driver setup using Windows including Signtool Code Signing flow


Complete implementation of a `pinned` version. Additionally it demostrates a complete Code Signing lifecycle using `signtool`.

See the [Venafi CodeSign Protect: Python (PyPi) Package](https://pypi.org/project/venafi-csp/) documentation for more detailed configuration examples and applicable parameters.

*Notes*:
- When using a *shared* runner, only update *runs-on:* parameter value with `windows-latest`.
- Signtool has to trust the Signer CA for proper verification, this requires to import the certificate chain using `EXTRA_TRUSTED_TLS_CA_CERTS`.
- More advanced parameters are available at  [Venafi CodeSign Protect: Python (PyPi) Package](https://pypi.org/project/venafi-csp/).

```yaml
jobs:
  example_job:
    runs-on: ["self-hosted", "Windows", "X64" ]   # runs-on: windows-latest
    name: Example with self-hosted Windows, executing Signtool Code Signing flow
    steps:
      - name: Setup Venafi CSP Driver
        id: cspdriver
        uses: qensus-labs/setup-venafi-csp@v1.0.0
        with:
          venafi-version: '24.1.0'
          venafi-csc-url: 'https://my-tpp/csc'
          venafi-auth-url: 'https://my-tpp/vedauth'
          venafi-hsm-url: 'https://my-tpp/vedhsm'
      - name: Display Venafi CSP Driver Cached Output Variables
        run: |
          echo "Output \"csp-driver-cached-path\" [${{steps.cspdriver.outputs.csp-driver-cached-path}}]"
          echo "Output \"csp-driver-cached-version\" [${{steps.cspdriver.outputs.csp-driver-cached-version}}]"
      - name: Check Venafi CSP Driver (version)
        run: |
          cspconfig.exe version
      - name: Build Software Artifact
        run: |
          copy C:\Windows\System32\Notepad.exe foo.exe
      - name: Store Software Artifact
        uses: actions/upload-artifact@v4
        with:
          name: foo.exe
          path: foo.exe
      - name: Setup Python SDK
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install Venafi CSP Python Package
        run: pip install venafi-csp
      - name: Show Venafi-CSP Package Version
        run: python -mvenafi_csp.version_command
      - name: Setup Windows SDK (Including signtool)
        uses: GuillaumeFalourd/setup-windows10-sdk-action@v2
        with:
          sdk-version: 20348
      - name: Add signtool executable to GITHUB PATH
        run: |
          "C:\Program files (x86)\Windows Kits\10\bin\10.0.20348.0\x64" >> $env:GITHUB_PATH
      - name: Sign Artifact with Signtool
        shell: cmd
        run: python -mvenafi_csp.signtool_sign_command
        env:
          TPP_AUTH_URL: 'https://my-tpp/vedauth'
          TPP_HSM_URL: 'https://my-tpp/vedhsm'
          TPP_USERNAME: signer
          TPP_PASSWORD: ${{ secrets.TPP_PASSWORD }}
          INPUT_PATH: foo.exe
          CERTIFICATE_SUBJECT_NAME: signer
          TIMESTAMPING_SERVERS: http://timestamp.digicert.com
      - name: Verify Artifact with Signtool
        shell: cmd
        run: python -mvenafi_csp.signtool_verify_command
        env:
          TPP_AUTH_URL: 'https://my-tpp/vedauth'
          TPP_HSM_URL: 'https://my-tpp/vedhsm'
          TPP_USERNAME: signer
          TPP_PASSWORD: ${{ secrets.TPP_PASSWORD }}
          INPUT_PATH: foo.exe
      - name: Store Signed Software Artifact
        uses: actions/upload-artifact@v4
        with:
          name: foo-signed.exe
          path: foo.exe
```

## Contribution & development

Please refer to our [contribution guide](CONTRIBUTING.md).