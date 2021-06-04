#!/bin/bash
set -ev; # stop on error

echo "Installing dependencies required for tests in codegens/java-okhttp"
pushd ./codegens/java-okhttp &>/dev/null;
  sudo add-apt-repository ppa:openjdk-r/ppa -y
  sudo rm -rf /var/lib/apt/lists/*
  sudo apt-get update
  sudo apt-get install -y openjdk-8-jdk
  unzip test/unit/fixtures/dependencies.zip
popd &>/dev/null;

echo "Installing dependencies required for tests in codegens/kotlin-okhttp"
pushd ./codegens/kotlin-okhttp &>/dev/null;
  sudo add-apt-repository ppa:openjdk-r/ppa -y
  sudo rm -rf /var/lib/apt/lists/*
  sudo apt-get update
  sudo apt-get install -y openjdk-8-jdk
  sudo snap install --classic kotlin
  unzip test/unit/fixtures/dependencies.zip
popd &>/dev/null;

echo "Installing dependencies required for tests in codegens/java-unirest"
pushd ./codegens/java-unirest &>/dev/null;
  unzip test/unit/fixtures/dependencies.zip
popd &>/dev/null;

echo "Installing dependencies required for tests in codegens/csharp-restsharp"
pushd ./codegens/csharp-restsharp &>/dev/null;
  wget -q https://packages.microsoft.com/config/ubuntu/16.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
  sudo dpkg -i packages-microsoft-prod.deb
  sudo apt-get install apt-transport-https
  sudo apt-get update
  sudo apt-get install dotnet-sdk-2.2
  dotnet new console -o testProject
  pushd ./testProject &>/dev/null;
  dotnet add package RestSharp
  popd &>/dev/null;
popd &>/dev/null;


echo "Installing Powershell"
  sudo apt-get install powershell -y

echo "Installing dependencies required for tests in codegens/php-httprequest2"
  pear install HTTP_Request2-2.3.0

echo "Installing dependencies required for tests in codegens/swift"
pushd ./codegens/swift &>/dev/null;
  sudo apt-get update
  sudo apt-get install clang-3.6 libicu-dev libpython2.7 -y
  sudo apt-get install libcurl3 libpython2.7-dev -y
  sudo wget https://swift.org/builds/swift-5.3-release/ubuntu1604/swift-5.3-RELEASE/swift-5.3-RELEASE-ubuntu16.04.tar.gz
  sudo tar xzf swift-5.3-RELEASE-ubuntu16.04.tar.gz
  sudo chmod 777 swift-5.3-RELEASE-ubuntu16.04/usr/lib/swift/CoreFoundation/module.map
popd &>/dev/null;

echo "Installing dependencies required for tests in codegens/csharp-restsharp"
sudo apt-get install -y mono-complete

echo "Installing curl v7.68"
  sudo apt-get install -y libssl-dev autoconf libtool make
  wget https://curl.haxx.se/download/curl-7.68.0.zip
  unzip curl-7.68.0.zip
  pushd ./curl-7.68.0 &>/dev/null
  ./buildconf
  ./configure --with-ssl
  make
  sudo make install
  sudo cp /usr/local/bin/curl /usr/bin/curl
  sudo ldconfig
  popd &>/dev/null

echo "Installing dependencies required for tests in codegens/shell-httpie"
sudo apt-get install httpie

echo "Installing dependencies required for tests in codegens/dart"
pushd ./codegens/dart-http &>/dev/null;
  wget https://storage.googleapis.com/dart-archive/channels/stable/release/2.10.2/linux_packages/dart_2.10.2-1_amd64.deb
  sudo dpkg -i dart_2.10.2-1_amd64.deb
  echo '''name: test
dependencies:
  http: ^0.12.2
''' > pubspec.yaml
  dart pub get
popd &>/dev/null;

