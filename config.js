var config = {
  iOSIcons: {
    "images": [
      // iPad Settings
      {
        "size" : "29x29",
        "idiom" : "iphone",
        "filename" : "Icon-App-29x29.png",
        "scale" : "1x"
      },
      // iPad Retina Settings or iPhone Settings 
      {
        "size" : "29x29",
        "idiom" : "iphone",
        "filename" : "Icon-App-29x29@2x.png",
        "scale" : "2x"
      },
      // iPhone Retina Settings 
      {
        "size" : "29x29",
        "idiom" : "iphone",
        "filename" : "Icon-App-29x29@3x.png",
        "scale" : "3x"
      },
      // iPad Spotlight
      {
        "size" : "40x40",
        "idiom" : "iphone",
        "filename" : "Icon-App-40x40.png",
        "scale" : "1x"
      },
      // iPhone Spotlight
      {
        "size" : "40x40",
        "idiom" : "iphone",
        "filename" : "Icon-App-40x40@2x.png",
        "scale" : "2x"
      },
      // iPhone Retina Spotlight      
      {
        "size" : "40x40",
        "idiom" : "iphone",
        "filename" : "Icon-App-40x40@3x.png",
        "scale" : "3x"
      },
      // iPhone icon
      {
        "size" : "60x60",
        "idiom" : "iphone",
        "filename" : "Icon-App-60x60@2x.png",
        "scale" : "2x"
      },
      // iPhone Retina icon
      {
        "size" : "60x60",
        "idiom" : "iphone",
        "filename" : "Icon-App-60x60@3x.png",
        "scale" : "3x"
      },
      // iPad icon
      {
        "size" : "76x76",
        "idiom" : "ipad",
        "filename" : "Icon-App-76x76.png",
        "scale" : "1x"
      },
      // iPad Retina icon
      {
        "size" : "76x76",
        "idiom" : "ipad",
        "filename" : "Icon-App-76x76@2x.png",
        "scale" : "2x"
      },
      // iPad Pro
      {
        "idiom":"ipad",
        "size":"83.5x83.5",
        "scale":"2x",
        "filename":"Icon-App-83.5x83.5@2x.png"
      },
      // iTunes artwork
      {
        "size" : "512x512",
        "idiom" : "ipad",
        "filename" : "iTunesArtwork.png",
        "scale" : "1x"
      },
      // iTunes artwork
      {
        "size" : "512x512",
        "idiom" : "ipad",
        "filename" : "iTunesArtwork@2x.png",
        "scale" : "2x"
      },
    ]
  },
  android: {
    "images" : [
      {
        "baseRatio" : "3/4",
        "folder" : "mipmap-ldpi"
      },
      {
        "baseRatio" : "1",
        "folder" : "mipmap-mdpi"
      },
      {
        "baseRatio" : "4/3",
        "folder" : "mipmap-tvdpi"
      },
      {
        "baseRatio" : "1.5",
        "folder" : "mipmap-hdpi"
      },
      {
        "baseRatio" : "2",
        "folder" : "mipmap-xhdpi"
      },
      {
        "baseRatio" : "3",
        "folder" : "mipmap-xxhdpi"
      },
      {
        "baseRatio" : "4",
        "folder" : "mipmap-xxxhdpi"
      }
    ]
  },
  iOSLaunchImages: {
    "images": [
      // iPhone 6Plus
      {
        "extent" : "full-screen",
        "idiom" : "iphone",
        "subtype" : "736h",
        "filename" : "Default-Portrait-736h@3x.png",
        "minimum-system-version" : "8.0",
        "orientation" : "portrait",
        "scale" : "3x",
        "size" : {
          "width" : 1242,
          "height" : 2208
        }
      },
      {
        "extent" : "full-screen",
        "idiom" : "iphone",
        "subtype" : "736h",
        "filename" : "Default-Landscape-736h@3x.png",
        "minimum-system-version" : "8.0",
        "orientation" : "landscape",
        "scale" : "3x",
        "size" : {
          "width" : 2208,
          "height" : 1242
        }
      },
      // iPhone 6
      {
        "extent" : "full-screen",
        "idiom" : "iphone",
        "subtype" : "667h",
        "filename" : "Default-Portrait-667h@2x.png",
        "minimum-system-version" : "8.0",
        "orientation" : "portrait",
        "scale" : "2x",
        "size" : {
          "width" : 750,
          "height" : 1334
        }
      },
      {
        "extent" : "full-screen",
        "idiom" : "iphone",
        "subtype" : "667h",
        "filename" : "Default-Landscape-667h@2x.png",
        "minimum-system-version" : "8.0",
        "orientation" : "landscape",
        "scale" : "2x",
        "size" : {
          "width" : 1334,
          "height" : 750
        }
      },
      // iPhone 5, no landscape
      {
        "extent" : "full-screen",
        "idiom" : "iphone",
        "subtype" : "retina4",
        "filename" : "Default-Portrait-568h@2x.png",
        "minimum-system-version" : "7.0",
        "orientation" : "portrait",
        "scale" : "2x",
        "size" : {
          "width" : 640,
          "height" : 1136
        }
      },
      // iPhone 4S, no landscape
      {
        "orientation" : "portrait",
        "idiom" : "iphone",
        "filename" : "Default-Portrait@2x.png",
        "extent" : "full-screen",
        "minimum-system-version" : "7.0",
        "scale" : "2x",
        "size" : {
          "width" : 640,
          "height" : 960
        }
      },
      // iPad non-Retina
      {
        "orientation" : "portrait",
        "idiom" : "ipad",
        "extent" : "to-status-bar",
        "minimum-system-version" : "7.0",
        "filename" : "Default-768x1004.png",
        "scale" : "1x",
        "size" : {
          "width" : 768,
          "height" : 1004
        }
      },
      {
        "orientation" : "landscape",
        "idiom" : "ipad",
        "extent" : "to-status-bar",
        "minimum-system-version" : "7.0",
        "filename" : "Default-1024x748.png",
        "scale" : "1x",
        "size" : {
          "width" : 1024,
          "height" : 748
        }
      },
      // iPad Retina
      {
        "orientation" : "portrait",
        "idiom" : "ipad",
        "extent" : "to-status-bar",
        "minimum-system-version" : "7.0",
        "filename" : "Default-1536x2008.png",
        "scale" : "2x",
        "size" : {
          "width" : 1536,
          "height" : 2008
        }
      },
      {
        "orientation" : "landscape",
        "idiom" : "ipad",
        "extent" : "to-status-bar",
        "minimum-system-version" : "7.0",
        "filename" : "Default-2048x1496.png",
        "scale" : "2x",
        "size" : {
          "height" : 1496,
          "width" : 2048
        }
      },
    ]
  }
};

exports = module.exports = config;
