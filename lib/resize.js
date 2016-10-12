var exec = require('child_process').exec;
var path = require('path');
var async = require('async');
var mkdirp = require('mkdirp');
var sizeOf = require('image-size');
var math = require('mathjs');
var fs = require('fs');

var defaults = {
  PLATFORMS_TO_BUILD: ['ios', 'android', 'launchImage'],
  ORIGINAL_ICON_FILE_NAME: 'appicon_1024.png',
  ORIGINAL_LOGO_FILE_NAME: 'appicon_1024.png',
  IOS_FILE_NAME_PREFIX: 'Icon',
  IOS_OUTPUT_FOLDER: 'ios',
  LAUNCH_IMAGE_FOLDER: 'LaunchImage',
  ANDROID_OUTPUT_FOLDER: 'android',
  ANDROID_BASE_SIZE: 48,
  CONVERT_BIN: 'convert',
  BACKGROUND_COLOR: 'rgba(0,0,0,1)',
  LOGO_SCALE: 0.5
};

// Convert "29x29" to 29 or "2x" to 2
function getSize(str) {
  return str.split("x")[0].trim();
}

/**
 * Calculate the target image size based on the size ratio
 * from the original input image size or base image size.
 *
 * @param  {object} options An object with the following properties:
 *                          - originalSize
 *                          - ratio
 * @return {[type]}         [description]
 */
function getSizeFromRatio(options) {
  var ratio = math.eval(options.ratio);
  return Math.floor(options.size * ratio);
}

function executeResize(options, callback) {
  var dimensions = options.size + 'x' + options.size;
  var command = options.convertBin + ' "' + options.inputFile + '" -thumbnail ' + dimensions + ' "' + options.outputFile + '"';

  child = exec(
    command,
    function (err, stdout, stderr) {
      if (stderr) {
        console.log('stderr: ' + stderr);
      }
      if (err !== null) {
        console.log('exec error: ' + err);
      }
      callback(err);
    }
  );
}

function executeDrawLaunch(options, callback) {
  
  var outputWidth = options.finalSize.width;
  var outputHeight = options.finalSize.height;
  var longSide = Math.max(outputWidth, outputHeight);

  var scale = 0.5;
  var logoDimensions = sizeOf(options.inputFile);
  
  var iw = outputWidth * scale,
      ih = (iw / logoDimensions.width) * logoDimensions.height;
  
  var landscape = outputWidth > outputHeight;
  if (landscape) {
    ih = outputHeight * scale;
    iw = (ih / logoDimensions.height) * logoDimensions.width;
  }
  
  var ix = (outputWidth - iw) / 2,
      iy = (outputHeight - ih) / 2;

  var draw = 'image SrcOver ' + ix + ',' + iy + ' ' + iw + ',' + ih + " '" + options.inputFile + "'";
  var command = options.convertBin +
    ' -size ' + outputWidth + 'x' + outputHeight +
    ' xc:"' + options.bg + '"' +
    ' -draw "' + draw + '"' +
    ' "' + options.outputFile + '"';

  child = exec(
    command,
    function (err, stdout, stderr) {
      if (stderr) {
        console.log('stderr: ' + stderr);
      }
      if (err !== null) {
        console.log('exec error: ' + err);
      }
      callback(err);
    }
  );
}

function convertiOS(options, callback) {
  var images = options.config.iOSIcons.images;

  function handleAppIcon(image, done) {
    var size = getSize(image.size);
    var scale = getSize(image.scale);
    var finalSize = size * scale;
    var baseFolder = options.iosOutputFolder;
    mkdirp.sync(baseFolder);
    var fileName = path.join(baseFolder, options.iosFilenamePrefix + image.filename);
    executeResize(
      {
        convertBin: options.convertBin,
        inputFile: options.originalIconFilename,
        size: finalSize,
        outputFile: fileName
      },
      function (err) {
        done(err);
      }
    );
  }

  async.each(
    images,
    handleAppIcon,
    function (err) {
      callback(err);
    }
  );
  var json = JSON.stringify(options.config.iOSIcons, null, 2);
  fs.writeFile(path.join(options.iosOutputFolder, 'Contents.json'), json, 'utf8');
}

/**
 *
 * @param  {[type]}   options  Parameters:
 *                             - originalSize
 * @param  {Function} callback
 * @return {undefined}
 */
function convertAndroid(options, callback) {
  var images = options.config.android.images;

  function handleImage(image, done) {
    var size = 100;
    if (image.baseRatio) {
      size = getSizeFromRatio({
        size: options.androidBaseSize,
        ratio: image.baseRatio
      });
    } else if (image.ratio) {
      size = getSizeFromRatio({
        size: options.originalSize,
        ratio: image.ratio
      });
    } else if (image.size) {
      size = getSize(image.size);
    } else {
      return done(new Error('No size nor ratio defined for Android icon'));
    }

    var baseFolder = path.join(options.androidOutputFolder, image.folder);
    mkdirp.sync(baseFolder);
    var fileName = path.join(baseFolder, options.androidOutputFilename);
    executeResize(
      {
        convertBin: options.convertBin,
        inputFile: options.originalIconFilename,
        size: size,
        outputFile: fileName
      },
      function (err) {
        done(err);
      }
    );
  }

  async.each(
    images,
    handleImage,
    function (err) {
      callback(err);
    }
  );
}

function convertLaunchImages(options, callback) {
  var images = options.config.iOSLaunchImages.images;

  function handleLaunchImages(image, done) {  
    var size = image.size;
    var scale = getSize(image.scale);
    var finalSize = image.size;
    var baseFolder = options.iosLaunchImageFolder;
    mkdirp.sync(baseFolder);
    var fileName = path.join(baseFolder, image.filename);
    executeDrawLaunch(
      {
        convertBin: options.convertBin,
        inputFile: options.originalLogoFilename,
        finalSize: finalSize,
        outputFile: fileName,
        bg: options.backgroundColor,
        logoScale: options.logoScale,
      },
      function (err) {
        done(err);
      }
    );
  }

  async.each(
    images,
    handleLaunchImages,
    function (err) {
      callback(err);
    }
  );
  
  var json = JSON.stringify(options.config.iOSLaunchImages, null, 2);
  fs.writeFile(path.join(options.iosLaunchImageFolder, 'Contents.json'), json, 'utf8');
}

var platformConverters = {
  'android': convertAndroid,
  'ios': convertiOS,
  'launchImage': convertLaunchImages
};

/**
 * The entry method to batch resize images for Android and/or iOS.
 *
 * @param  {object} options The following params are supported:
 *                          - platformsToBuild: For which platforms should the icons be resized. Comma-separated list.
 *                          - originalIconFilename: The prefix of the iOS image files.
 *                          - iosFilenamePrefix: The prefix of the iOS image files.
 *                          - iosOutputFolder: The output folder for the iOS icons.
 *                          - androidOutputFolder: The output folder for the Android icons.
 *                          - androidOutputFilename: The output file name for the Android icons.
 *                          - androidBaseSize: The base size to consider for the `baseRatio` calculation.
 *                          - convertBin: The Image Magic "convert" binary name, if not "convert".
 * @return {undeifned}
 */
var resize = function (options, callback) {
  options = options || {};

  options.platformsToBuild = options.platformsToBuild || defaults.PLATFORMS_TO_BUILD;
  options.originalIconFilename = options.originalIconFilename || defaults.ORIGINAL_ICON_FILE_NAME;
  options.originalLogoFilename = options.originalLogoFilename || defaults.ORIGINAL_LOGO_FILE_NAME;
  options.iosFilenamePrefix = options.iosFilenamePrefix || defaults.IOS_FILE_NAME_PREFIX;
  options.iosOutputFolder = options.iosOutputFolder || defaults.IOS_OUTPUT_FOLDER;
  options.androidOutputFolder = options.androidOutputFolder || defaults.ANDROID_OUTPUT_FOLDER;
  options.iosLaunchImageFolder = options.iosLaunchImageFolder || defaults.LAUNCH_IMAGE_FOLDER;
  options.androidOutputFilename = options.androidOutputFilename || path.basename(options.originalIconFilename);
  options.androidBaseSize = options.androidBaseSize || defaults.ANDROID_BASE_SIZE;
  options.logoScale = options.logoScale || defaults.LOGO_SCALE;
  options.backgroundColor = options.backgroundColor || defaults.BACKGROUND_COLOR;

  var dimensions = sizeOf(options.originalIconFilename);
  options.originalSize = Math.max(dimensions.width, dimensions.height);

  // Load the actual config object from a custom file or our default config
  options.config = (options.config) ? require(path.resolve(options.config)) : require('../config');

  // command line convertBin ? config file convertBin ? default.
  options.convertBin = options.convertBin || (options.config.convertBin ? options.config.convertBin : defaults.CONVERT_BIN);

  async.each(
    options.platformsToBuild,
    function (item, done) {
      if (typeof platformConverters[item] !== 'function') {
        return done(new Error('Platform type "' + item + '" is not supported.'));
      }
      platformConverters[item](options, done);
    },
    callback
  );
};

resize.defaults = defaults;
exports = module.exports = resize;
