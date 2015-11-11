var
async   = require('async'),
exec    = require('child_process').exec,
fs	    = require('fs-extra'),
gm      = require('gm').subClass({imageMagick: true}),
mmm     = require('mmmagic'),
Magic   = mmm.Magic,
mkdirp  = require('mkdirp'),
path    = require('path'),
sizeOf  = require('image-size');

var defaults = {
    PLATFORMS_TO_BUILD      : ['ios', 'android'],
    ORIGINAL_ICON_FILE_NAME : 'appicon_1024.png',
    IOS_FILE_NAME_PREFIX    : 'Icon',
    IOS_REMOVE_ALPHA        : false,
    IOS_BACKGROUND_COLOR    : 'white',
    IOS_OUTPUT_FOLDER       : '.',
    ANDROID_OUTPUT_FOLDER   : '.',
    ANDROID_BASE_SIZE       : 48
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
    var ratio = eval(options.ratio); // Yeah, eval... Deal with it!
    return Math.floor(options.size * ratio);
}

function executeResize(options, callback) {
    var
    filename    = options.platform+options.outputFile.split('/'+options.platform).pop(),
    dimensions  = options.size + 'x' + options.size,
    command     = 'convert "' + options.inputFile + '"';
    if(options.platform && options.platform=='ios' && options.removeAlpha)
        command+=' -background '+(options.background || 'white')+' -alpha remove';
    command+=' -thumbnail ' + dimensions + ' -gravity center -extent ' + dimensions + ' "' + options.outputFile + '"';

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

function convertiOS(options, callback) {
    var images = options.config.iOS.images;

    function handleImage(image, done) {
        var
        basename    = options.iosFilenamePrefix + image.filename,
        scale       = getSize(image.scale),
        size        = getSize(image.size),
        finalSize   = size * scale,
        baseFolder  = options.iosOutputFolder;
        mkdirp.sync(baseFolder);
        var fileName = path.join(baseFolder, basename);
        executeResize(
            {
                platform    : 'ios',
                inputFile   : options.originalIconFilename,
                size        : finalSize,
                outputFile  : fileName,
                removeAlpha : options.iosRemoveAlpha,
                background  : options.iosBackgroundColor,
                logLevel    : options.logLevel,
                log         : options.log
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
            size = getSizeFromRatio({ size: options.androidBaseSize, ratio: image.baseRatio});
        } else if (image.ratio) {
            size = getSizeFromRatio({ size: options.originalSize, ratio: image.ratio});
        } else if (image.size) {
            size = getSize(image.size);
        } else {
            return done(new Error('No size nor ratio defined for Android icon'));
        }
        var
        basename    = (image.filename)?image.filename:options.androidOutputFilename,
        baseFolder  = (image.folder)?path.join(options.androidOutputFolder, image.folder):options.androidOutputFolder;
        mkdirp.sync(baseFolder);
        var fileName = path.join(baseFolder, basename);
        executeResize(
            {
                platform    : 'android',
                inputFile   : options.originalIconFilename,
                size        : size,
                outputFile  : fileName,
                logLevel    : options.logLevel,
                log         : options.log
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

var platformConverters = {
    'android': convertAndroid,
    'ios': convertiOS
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
            var image   = fs.readFileSync(options.originalIconFilename),
            newname     = options.originalIconFilename.replace(/\.svg$/i,'')+'.png'; //strip svg extension then add .png
            gm(options.originalIconFilename).write(newname, function(err){
                options.originalIconFilename=newname;
                if(options.logLevel>0)
                    options.log('Image converted from SVG');
                cback();
            });
            return;
        }
        cback();
    });
}

/**
 * The entry method to batch resize images for Android and/or iOS.
 *
 * @param  {[type]} options The following params are supported:
 *                          - platformsToBuild: For which platforms should the icons be resized. Comma-separated list.
 *                          - originalIconFilename: The prefix of the iOS image files.
 *                          - iosFilenamePrefix: The prefix of the iOS image files.
 *                          - iosOutputFolder: The output folder for the iOS icons.
 *                          - androidOutputFolder: The output folder for the Android icons.
 *                          - androidOutputFilename: The output file name for the Android icons.
 *                          - androidBaseSize: The base size to consider for the `baseRatio` calculation.
 * @return {[type]}         [description]
 */
var resize = function (options, callback) {
    options = options || {};

    options.platformsToBuild        = options.platformsToBuild || defaults.PLATFORMS_TO_BUILD;
    options.originalIconFilename    = options.originalIconFilename || defaults.ORIGINAL_ICON_FILE_NAME;
    options.iosFilenamePrefix       = (typeof options.iosFilenamePrefix=="string")?options.iosFilenamePrefix:defaults.IOS_FILE_NAME_PREFIX;
    options.iosBackgroundColor      = options.iosBackgroundColor || defaults.IOS_BACKGROUND_COLOR;
    options.iosRemoveAlpha          = (typeof options.iosRemoveAlpha=="boolean")?options.iosRemoveAlpha:defaults.IOS_REMOVE_ALPHA
    options.iosOutputFolder         = options.iosOutputFolder || defaults.IOS_OUTPUT_FOLDER;
    options.androidOutputFolder     = options.androidOutputFolder || defaults.ANDROID_OUTPUT_FOLDER;
    options.androidOutputFilename   = options.androidOutputFilename || path.basename(options.originalIconFilename);
    options.androidBaseSize         = options.androidBaseSize || defaults.ANDROID_BASE_SIZE;
    options.logLevel                = options.logLevel || 0;
    options.log                     = options.log || console.log;

    checkImageType(options,function(){
        if(options.logLevel>0)
            options.log('resizing '+options.originalIconFilename);
        var dimensions = sizeOf(options.originalIconFilename);
        options.originalSize = Math.max(dimensions.width, dimensions.height);

        // Load the actual config object from a custom file or our default config
        options.config = (options.config) ? require(path.resolve(options.config)) : require('../config');

        async.each(
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
