const shell = require('shelljs'),
  path = require('path'),
  async = require('async');

shell.config.fatal = true; // stops on error
shell.config.verbose = true; // logging commands that are being executed

// CODE FOR OKHTTP
shell.pushd(path.resolve(__dirname, '../codegens/java-okhttp'), 'q');
async.series([
  function (next) {
    let commandOutput = shell.exec('sudo add-apt-repository ppa:openjdk-r/ppa -y');

    if (commandOutput.code !== 0) {
      console.log('Error while adding openjdk Repository and error details are: ');
      return next(commandOutput.stderr);
    }
    console.log('OpenJDK Repository Added successfully');
    return next();
  },
  function (next) {
    let commandOutput = shell.exec('sudo rm -rf /var/lib/apt/lists/*');

    if (commandOutput.code !== 0) {
      return next(commandOutput.stderr);
    }

    return next();
  },
  function (next) {
    let commandOutput = shell.exec('sudo apt-get update');

    if (commandOutput.code !== 0) {
      return next(commandOutput.stderr);
    }
    return next();
  },
  function (next) {
    console.log('Installing Openjdk');
    let commandOutput = shell.exec('sudo apt-get install -y openjdk-8-jdk');
    if (commandOutput.code !== 0) {
      console.log('Error While installing Openjdk');
      return next(commandOutput.stderr);
    }
    console.log('OpenJdk Installed Successfully');
    return next();
  },
  function (next) {
    let commandOutput = shell.exec('unzip test/unit/fixtures/dependencies.zip');
    if (commandOutput.code !== 0) {
      return next(commandOutput.stderr);
    }
    return next();
  }], (err) => {
  if (err) {
    console.error(err);
  }
});
shell.popd(null, 'q');
// CODE FOR OKHTTP==END

// JAVA UNIREST CODE STARTED
shell.echo('Installing dependencies required for tests in codegens/java-unirest');
shell.pushd(path.resolve(__dirname, '../codegens/java-unirest'), 'q');
async.series([
  function (next) {
    let commandOutput = shell.exec('unzip test/unit/fixtures/dependencies.zip');
    if (commandOutput.code !== 0) {
      return next(commandOutput.stderr);
    }
    return next();
  }], (err) => {
  if (err) {
    console.error(err);
  }
});
shell.popd(null, 'q');
// JAVA UNIREST CODE END

shell.echo('Installing dependencies required for tests in codegens/csharp-restsharp');
shell.pushd(path.resolve(__dirname, '../codegens/csharp-restsharp'), 'q');
async.series([
  function (next) {
    // eslint-disable-next-line max-len
    let commandOutput = shell.exec('wget -q https://packages.microsoft.com/config/ubuntu/16.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb');
    if (commandOutput.code !== 0) {
      return next(commandOutput.stderr);
    }
    return next();
  },
  function (next) {
    let commandOutput = shell.exec('sudo dpkg -i packages-microsoft-prod.deb');
    if (commandOutput.code !== 0) {
      return next(commandOutput.stderr);
    }
    return next();
  },
  function (next) {
    let commandOutput = shell.exec('sudo apt-get install apt-transport-https');
    if (commandOutput.code !== 0) {
      return next(commandOutput.stderr);
    }
    return next();
  },
  function (next) {
    let commandOutput = shell.exec('sudo apt-get update');
    if (commandOutput.code !== 0) {
      return next(commandOutput.stderr);
    }
    return next();
  },
  function (next) {
    let commandOutput = shell.exec('sudo apt-get install dotnet-sdk-2.2');
    if (commandOutput.code !== 0) {
      return next(commandOutput.stderr);
    }
    return next();
  },
  function (next) {
    let commandOutput = shell.exec('dotnet new console -o testProject');
    if (commandOutput.code !== 0) {
      return next(commandOutput.stderr);
    }
    return next();
  },
  function (next) {
    shell.pushd('./testProject', 'q');
    let commandOutput = shell.exec('dotnet add package RestSharp');
    shell.popd(null, 'q');
    if (commandOutput.code !== 0) {
      return next(commandOutput.stderr);
    }
    return next();
  }

], (err) => {
  if (err) {
    console.error(err);
  }
});
shell.popd(null, 'q');

shell.echo('Installing dependencies required for tests in codegens/php-httprequest2');
shell.exec('pear install HTTP_Request2-2.3.0', {}, function (code, stdout, stderr) {
  if (code !== 0) {
    console.error(stderr);
    return;
  }
  console.log(stdout);
});

shell.echo('Installing dependencies required for tests in codegens/swift');
shell.pushd(path.resolve(__dirname, '../codegens/swift'), 'q');
async.series([
  function (next) {
    let commandOutput = shell.exec('sudo apt-get update');
    if (commandOutput.code !== 0) {
      return next(commandOutput.stderr);
    }
    return next();
  },
  function (next) {
    let commandOutput = shell.exec('sudo apt-get install clang-3.6 libicu-dev libpython2.7 -y');
    if (commandOutput.code !== 0) {
      return next(commandOutput.stderr);
    }
    return next();
  },
  function (next) {
    let commandOutput = shell.exec('sudo apt-get install libcurl3 libpython2.7-dev -y');
    if (commandOutput.code !== 0) {
      return next(commandOutput.stderr);
    }
    return next();
  },
  function (next) {
    // eslint-disable-next-line max-len
    let commandOutput = shell.exec('sudo wget https://swift.org/builds/swift-5.0.1-release/ubuntu1604/swift-5.0.1-RELEASE/swift-5.0.1-RELEASE-ubuntu16.04.tar.gz');
    if (commandOutput.code !== 0) {
      return next(commandOutput.stderr);
    }
    return next();
  },
  function (next) {
    let commandOutput = shell.exec('sudo tar xzf swift-5.0.1-RELEASE-ubuntu16.04.tar.gz');
    if (commandOutput.code !== 0) {
      return next(commandOutput.stderr);
    }
    return next();
  },
  function (next) {
    // eslint-disable-next-line max-len
    let commandOutput = shell.exec('sudo chmod 777 swift-5.0.1-RELEASE-ubuntu16.04/usr/lib/swift/CoreFoundation/module.map');
    if (commandOutput.code !== 0) {
      return next(commandOutput.stderr);
    }
    return next();
  }

], (err) => {
  if (err) {
    console.error(err);
  }
});
shell.popd(null, 'q');


async.series([
  function (next) {
    shell.echo('Installing dependencies required for tests in codegens/csharp-restsharp');
    let commandOutput = shell.exec('sudo apt-get install -y mono-complete');
    if (commandOutput.code !== 0) {
      return next(commandOutput.stderr);
    }
    return next();
  },
  function (next) {
    shell.echo('Installing dependencies required for tests in codegens/shell-httpie');
    let commandOutput = shell.exec('sudo apt-get install httpie');
    if (commandOutput.code !== 0) {
      return next(commandOutput.stderr);
    }
    return next();
  }
], (err) => {
  if (err) {
    console.error(err);
  }
});


