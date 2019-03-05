var
async     = require('async'),
exec      = require('child_process').exec,
fs	      = require('fs-extra'),
mmm       = require('mmmagic'),
Magic     = mmm.Magic,
math 	    = require('mathjs'),
mkdirp    = require('mkdirp'),
path      = require('path'),
sizeOf    = require('image-size'),
defaults  = {
  PLATFORMS_TO_BUILD        : ['ios', 'android', 'launchImage'],
  ORIGINAL_ICON_FILE_NAME   : 'appicon_1024.png',
  ORIGINAL_LOGO_FILE_NAME   : 'appicon_1024.png',
  IOS_FILE_NAME_PREFIX      : 'Icon',
  IOS_REMOVE_ALPHA          : false,
  IOS_BACKGROUND_COLOR      : 'white',
  LAUNCH_IMAGE_FOLDER       : 'LaunchImage',
  IOS_OUTPUT_FOLDER         : 'ios',
  ANDROID_OUTPUT_FOLDER     : 'android',
  ANDROID_BASE_SIZE         : 48,
  CONVERT_BIN               : 'convert',
  ANDROID_PLAYSTORE_ICON_BG : false,
  BACKGROUND_COLOR          : 'rgba(0,0,0,1)',
  LOGO_SCALE                : 0.5
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
  var filename    = options.platform+options.outputFile.split('/'+options.platform).pop(); //name used for logging
  var dimensions  = options.size + 'x' + options.size;
  var command     = 'convert -density 1200';
  if(options.platform && (options.platform=='ios' && (options.options.removeAlpha || options.outputFile.indexOf('iTunesArtwork')) || options.platform=='android' && options.options.androidPlaystoreIconBG && options.outputFile.indexOf('playstore-icon')!=-1))
    command+=' -background '+(options.options.iosBackgroundColor || 'white')+' -alpha remove';
  else
    command+=' -background none';
  command+=' -thumbnail ' + dimensions + ' -gravity center -extent ' + dimensions + ' "' + options.inputFile + '" '+
    (options.platform && options.platform=='ios' && options.options.iosConvertGrayToRGB?'-type TrueColorMatte -define png:color-type=6 ':'')+'"' + options.outputFile + '"';

  if(options.logLevel>1)
    options.log('Resizing '+filename+' @ '+dimensions);
  if(options.logLevel>2)
    options.log(command);
  child = exec(command,
  function (err, stdout, stderr) {
    if (stderr) {
      options.log('stderr: ' + stderr);
    }
    if (err !== null) {
      options.log('exec error: ' + err);
    }
    if(options.logLevel>1)
      options.log('Resizing '+filename+' @ '+dimensions+' DONE!');
    callback(err);
  });
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
    var basename    = options.iosFilenamePrefix + image.filename;
    var scale       = getSize(image.scale);
    var size        = getSize(image.size);
    var finalSize   = size * scale;
    var baseFolder  = options.iosOutputFolder;
    mkdirp.sync(baseFolder);
    var fileName = path.join(baseFolder, basename);
    executeResize(
      {
		    convertBin	: options.convertBin,
        platform    : 'ios',
        inputFile   : options.originalIconFilename,
        size        : finalSize,
        outputFile  : fileName,
        removeAlpha : options.iosRemoveAlpha,
        background  : options.iosBackgroundColor,
        options     : options,
        logLevel    : options.logLevel,
        log         : options.log
      },
      function (err) {
        done(err);
      }
    );
  }

  async[options.asyncFct](
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
    var basename    = (image.filename)?image.filename:options.androidOutputFilename;
    var baseFolder  = (image.folder)?path.join(options.androidOutputFolder, image.folder):options.androidOutputFolder;
    mkdirp.sync(baseFolder);
    var fileName = path.join(baseFolder, basename);
    executeResize(
      {
		    convertBin	: options.convertBin,
		    platform    : 'android',
        inputFile   : options.originalIconFilename,
        size        : size,
        outputFile  : fileName,
        logLevel    : options.logLevel,
        options     : options,
        log         : options.log
      },
      function (err) {
        done(err);
      }
    );
  }

  async[options.asyncFct](
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
        convertBin    : options.convertBin,
        inputFile     : options.originalLogoFilename,
        finalSize     : finalSize,
        outputFile    : fileName,
        bg            : options.backgroundColor,
        logoScale     : options.logoScale
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
  'android'		: convertAndroid,
  'ios'			: convertiOS,
  'launchImage'	: convertLaunchImages
};


/**
 * Check image type, convert SVG if needed
 *
 * @param options resize options object
 * @param cback return function
 */
var checkImageType=function(options,cback){
  var magic = new Magic(mmm.MAGIC_MIME_TYPE);
  magic.detectFile(options.originalIconFilename, function(err, result) {
    if (err) throw err;
    if(result.indexOf('image/')!=0)
      throw new Error('Unsopported file type: '+result);
    if(result=='image/svg+xml'){
      cback('svg');
      return;
    }
    cback(result.split('/').pop());
  });
}

/**
 * The entry method to batch resize images for Android and/or iOS.
 *
 * @param  {object} options The following params are supported:
 *                          - platformsToBuild: For which platforms should the icons be resized. Comma-separated list.
 *                          - originalIconFilename: The prefix of the iOS image files.
 *                          - iosOutputFolder: The output folder for the iOS icons.
 *                          - androidOutputFolder: The output folder for the Android icons.
 *                          - androidOutputFilename: The output file name for the Android icons.
 *                          - androidBaseSize: The base size to consider for the `baseRatio` calculation.
 *                          - convertBin: The Image Magic "convert" binary name, if not "convert".
 * @return {undeifned}
 */
var resize = function (options, callback) {
  options = options || {};

  options.platformsToBuild        = options.platformsToBuild || defaults.PLATFORMS_TO_BUILD;
  options.originalIconFilename    = options.originalIconFilename || defaults.ORIGINAL_ICON_FILE_NAME;
  options.originalLogoFilename    = options.originalLogoFilename || defaults.ORIGINAL_LOGO_FILE_NAME;
  options.iosOutputFolder         = options.iosOutputFolder || defaults.IOS_OUTPUT_FOLDER;
  options.androidOutputFolder     = options.androidOutputFolder || defaults.ANDROID_OUTPUT_FOLDER;
  options.iosLaunchImageFolder    = options.iosLaunchImageFolder || defaults.LAUNCH_IMAGE_FOLDER;
  options.iosFilenamePrefix       = (typeof options.iosFilenamePrefix=="string")?options.iosFilenamePrefix:defaults.IOS_FILE_NAME_PREFIX;
  options.iosBackgroundColor      = options.iosBackgroundColor || defaults.IOS_BACKGROUND_COLOR;
  options.iosRemoveAlpha          = (typeof options.iosRemoveAlpha=="boolean")?options.iosRemoveAlpha:defaults.IOS_REMOVE_ALPHA
  options.iosOutputFolder         = options.iosOutputFolder || defaults.IOS_OUTPUT_FOLDER;
  options.androidOutputFolder     = options.androidOutputFolder || defaults.ANDROID_OUTPUT_FOLDER;
  options.androidOutputFilename   = options.androidOutputFilename || path.basename(options.originalIconFilename);
  options.androidBaseSize         = options.androidBaseSize || defaults.ANDROID_BASE_SIZE;
  options.androidPlaystoreIconBG  = options.androidPlaystoreIconBG || defaults.ANDROID_PLAYSTORE_ICON_BG;
  options.logoScale               = options.logoScale || defaults.LOGO_SCALE;
  options.backgroundColor         = options.backgroundColor || defaults.BACKGROUND_COLOR;
  options.logLevel                = options.logLevel || 0;
  options.log                     = options.log || console.log;
  options.serialProcessing        = options.serialProcessing || false

  options.asyncFct                = (options.serialProcessing)?'eachSeries':'each';

  checkImageType(options,function(imageType){
    if(options.logLevel>0)
      options.log('resizing '+options.originalIconFilename);
    var dimensions = sizeOf(options.originalIconFilename);
    options.originalSize = Math.max(dimensions.width, dimensions.height);

    // Load the actual config object from a custom file or our default config
    options.config = (options.config) ? require(path.resolve(options.config)) : require('../config');
	// command line convertBin ? config file convertBin ? default.
	options.convertBin = options.convertBin || (options.config.convertBin ? options.config.convertBin : defaults.CONVERT_BIN);

    async[options.asyncFct](
      options.platformsToBuild,
      function (item, done) {
        if (typeof platformConverters[item] !== 'function') {
          return done(new Error('Platform type "'+item+'" is not supported.'));
        }
        platformConverters[item](options, done);
      },
      callback
    );
  });
};

resize.defaults = defaults;
exports = module.exports = resize;
