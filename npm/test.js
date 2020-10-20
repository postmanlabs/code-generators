var shell = require('shelljs'),
  path = require('path'),
  fs = require('fs'),
  exists,
  codegen,
  codegen_path,
  commandOut,
  rootDir = shell.pwd();

const getSubfolders = (folder) => {
  return fs.readdirSync(folder)
    .map((subfolder) => { return { path: path.join(folder, subfolder), name: subfolder }; })
    .filter((obj) => { return fs.statSync(obj.path).isDirectory(); });
};

const runCommand = (command) => {
  commandOut = shell.exec(command);
  if (commandOut.code !== 0) {
    shell.exit(1);
  }
}

const individual_test = (codegen) => {
  console.log(`${codegen} : codegen-structure test`);
  runCommand(`mocha ./test/codegen/structure.test.js ${codegen} --color always`);

  console.log(`${codegen} : codegen-sanity test`);
  runCommand(`mocha ./test/codegen/sanity/sanity.test.js ${codegen} --color always`);

  codegen_path = path.join(PATH_TO_CODEGENS_FOLDER, codegen);
  shell.cd(codegen_path);
  runCommand('npm test --color always');
  shell.cd(rootDir);
}

const args = process.argv[2],
  PATH_TO_CODEGENS_FOLDER = path.resolve(__dirname, '../codegens');

console.log('Checking if languages.js file is present');
exists = fs.existsSync(path.resolve(__dirname, '../lib/assets/languages.js'));
if (exists) {
  console.log('languages.js present');
} else {
  console.log('Please run \'node npm/pre-package.js\' to get the file languages.js');
  shell.exit(1);
}
shell.cd(rootDir);

// Creating sample test files for testing formdataFileCollection
console.log('Creating test files and adding paths to collection for testing form data file uploads');
['test1.txt', 'test2.txt', 'test3.txt'].forEach((file, i) => {
  if (!fs.existsSync(file)) {
    shell.exec(`echo "Sample file ${i + 1}" >> ${file}`);
  }
});


runCommand('node ./npm/addPathToFormdataFile.js');

console.log('Running newman for common collection and storing results in newmanResponses.json');
runCommand('node ./test/codegen/newman/runNewman.js --color always');

if (args) {
  codegen = args;
  codegen_path = path.join(PATH_TO_CODEGENS_FOLDER, codegen);
  try {
    exists = fs.statSync(codegen_path).isDirectory();
  } catch (err) {
    console.log(`Codegen ${codegen} doesn't exist, please enter a valid name`);
    console.log(err);
    shell.exit(1);
  }
  individual_test(codegen);
  shell.cd(rootDir);
} else {
  console.log('Running common repository tests');
  //check whether all dependencies used are present in package.json, and vice versa.
  runCommand('dependency-check ./package.json --no-dev --missing --color always');

  // check for .gitignore, license.md, readme.md, .eslintrc and package.json
  runCommand('mocha ./test/system/repository.test.js --color always');

  var codegens = getSubfolders(PATH_TO_CODEGENS_FOLDER);
  codegens.forEach((codegen) => {
    individual_test(codegen.name);
  });

}

['test1.txt', 'text2.txt', 'text3.txt'].forEach((file) => {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
});
