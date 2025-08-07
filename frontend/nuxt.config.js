import colors from "vuetify/es5/util/colors";
const serveStatic = require("serve-static");
const path = require("path");

const routerBase =
  process.env.DEPLOY_ENV === "GH_PAGES"
    ? {
        router: {
          base: "/pregnancy-app/",
        },
      }
    : {
        router: {
          mode: "hash",
          // mode: "history",
          base: "/",
        },
      };

export default {
  // Runtime config to make environment variables available in browser
  publicRuntimeConfig: {
    deployEnv: process.env.DEPLOY_ENV || 'local',
    basePath: process.env.DEPLOY_ENV === "GH_PAGES" ? "/pregnancy-app" : ""
  },
  
  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: "ABI Generic Web App Template",
    htmlAttrs: {
      lang: "en",
    },
    link: [
      {
        rel: "icon",
        type: "image/x-icon",
        href: process.env.DEPLOY_ENV === "GH_PAGES" ? "/pregnancy-app/favicon2.ico" : "/favicon2.ico",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bad+Script&family=Raleway:wght@100;300&display=swap",
      },
    ],
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        name: "google-site-verification",
        content: "L6CIHWX38cm1gLthoxa4mWPpp_l6UGCrtyRe5ZNeKB0",
      },
      {
        hid: "description",
        name: "description",
        content:
          "An ABI Generic Web App Template",
      },
      { name: "format-detection", content: "telephone=no" },
      {
        name: "keywords",
        content:
          "Your Key words",
      },
    ],
    script: [
      {
        type: "text/javascript",
        src: process.env.DEPLOY_ENV === "GH_PAGES" ? "/pregnancy-app/js/tailwindcss.js" : "/js/tailwindcss.js",
      },
      {
        src: "https://www.googletagmanager.com/gtag/js?id=G-LXD5LJXP2Y",
        async: true,
      },
    ],
  },

  serverMiddleware: [
    // add middlewares
    {
      handler: serveStatic(path.resolve(__dirname, "static"), {
        setHeaders(res, path) {
          if (/\.mp4$/.test(path)) {
            res.setHeader("Content-Type", "video/mp4");
          }
        },
      }),
      prefix: "@/static",
    },
  ],
  // server: {
  //   // host: 'localhost', // default: localhost
  //   // port: 3005 // default: 3000
  // },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: ["@/assets/sass/global.scss", "@/assets/sass/base.scss"],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    "@/plugins/topics",
    "@/plugins/current-content",
    { src: "~/plugins/copper.js", ssr: false, mode: 'client' },
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: {
    dirs: [
      "~/components/support",
      "~/components/model",
      "~/components/navigation",
      "~/components/topics",
      "~/components/loading",
    ],
  },

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/vuetify
    "@nuxtjs/vuetify",
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    '@nuxtjs/axios'
  ],

  // Vuetify module configuration: https://go.nuxtjs.dev/config-vuetify
  vuetify: {
    customVariables: ["@/assets/sass/variables.scss"],
    treeShake: true,
    theme: {
      options: { customProperties: true },
      dark: false,
      themes: {
        light: {
          primary: "#DD3C51",     // red from palette
          accent: "#6C90B9",      // blue from palette
          accentLight: "#1F6683",     // teal from palette
          secondary: "#B8BCC8",   // light grey for buttons
          info: "#1F6683",        // teal from palette
          warning: "#DD3C51",     // red from palette
          subWarning: "#6C90B9",  // blue from palette
          error: "#DD3C51",       // red from palette
          subError: "#6C90B9",    // blue from palette
          success: "#1F6683",     // teal from palette
          subSuccess: "#6C90B9",  // blue from palette
          background: "#dbd9d5",  // light grey background
        },
        dark: {
          primary: "#DD3C51",     // red from palette
          accent: "#6C90B9",      // blue from palette
          accentLight: "#1F6683",     // teal from palette
          secondary: "#B8BCC8",   // light grey for buttons
          info: "#1F6683",        // teal from palette
          warning: "#DD3C51",     // red from palette
          subWarning: "#6C90B9",  // blue from palette
          error: "#DD3C51",       // red from palette
          subError: "#6C90B9",    // blue from palette
          success: "#1F6683",     // teal from palette
          subSuccess: "#6C90B9",  // blue from palette
          background: "#313657",  // dark navy from palette
        },
      },
    },
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    publicPath: process.env.DEPLOY_ENV === "GH_PAGES" ? "/pregnancy-app/_nuxt/" : "/_nuxt/",
    extend(config) {
      config.module.rules.push({
        test: /\.md$/i,
        use: "raw-loader",
      });
    },
    loaders: {
      sass: {
        implementation: require("sass"),
      },
      scss: {
        implementation: require("sass"),
      },
    },

  },

  target: "static",

  ...routerBase,
  generate: {
    dir: "build",
    fallback: true,
    //todo: modify routes afterwards
    routes: [
      // Modify these routes, when you config your routes for app
      "/pregnancy-changes",
      "/pregnancy-placenta",
      "/pregnancy-baby",
      "/conditions-fetal",
      "/conditions-birth", 
      "/conditions-care",
      "/ultrasound-what-is-ultrasound",
      "/ultrasound-waveforms",
      "/ultrasound-how",
      "/clinical-mid-wife",
      "/clinical-when-care-changes",
      "/support",
      "/about",
    ],
  },
};
