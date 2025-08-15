import { b as reactive, e as defineComponent, G as useGlobalStore, a as computed, m as createElementBlock, p as createBaseVNode, h as createCommentVNode, u as unref, H as normalizeStyle, I as renderSlot, C as normalizeClass, o as openBlock, r as ref, J as pe, f as createBlock, w as withCtx, j as createVNode, F as FormItem, K as ho, L as Form, t as createTextVNode, N as Button, O as setLogin, P as useRouter, R as api } from "./index-DpmXzz-i.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
const loginBgLight = "" + new URL("login-bg-light-B06Lwj28.png", import.meta.url).href;
const loginBgDark = "" + new URL("login-bg-dark-BRfAlFWv.png", import.meta.url).href;
const remotePlanet = "" + new URL("access-remote-planet-BdlEzrwj.svg", import.meta.url).href;
const remotePlanetDark = "" + new URL("access-remote-planet-dark-Bp8PbVqV.png", import.meta.url).href;
const remoteAstronaut = "" + new URL("access-remote-astronaut-B9ZukfTA.svg", import.meta.url).href;
const bindCode = "" + new URL("bind-code-CJHbKoWU.png", import.meta.url).href;
const bindCodeZh = "" + new URL("bind-code-zh-DSZ1cyvL.png", import.meta.url).href;
var UseBase64Images = /* @__PURE__ */ ((UseBase64Images2) => {
  UseBase64Images2["LOGIN_BG"] = "login_bg";
  UseBase64Images2["LOGIN_BG_DARK"] = "login_bg_dark";
  UseBase64Images2["REMOTE_ASTRONAUT"] = "remote_astronaut";
  UseBase64Images2["REMOTE_PLANET"] = "remote_planet";
  UseBase64Images2["REMOTE_PLANET_DARK"] = "remote_planet_dark";
  UseBase64Images2["BIND_CODE"] = "bind_code";
  UseBase64Images2["BIND_CODE_ZH"] = "bind_code_zh";
  return UseBase64Images2;
})(UseBase64Images || {});
const Base64ImageMap = /* @__PURE__ */ new Map([
  ["login_bg", loginBgLight],
  ["login_bg_dark", loginBgDark],
  ["remote_astronaut", remoteAstronaut],
  ["remote_planet", remotePlanet],
  ["remote_planet_dark", remotePlanetDark],
  ["bind_code", bindCode],
  ["bind_code_zh", bindCodeZh]
]);
const isValidBase64Image = (base64) => {
  if (!base64) return false;
  return base64.startsWith("data:image/");
};
function loadImageAndTRansferToBase64(imgSrc) {
  const image = new Image();
  image.src = imgSrc;
  return new Promise((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(image, 0, 0);
        const base64 = canvas.toDataURL("image/png");
        resolve(base64);
      } else {
        reject();
      }
    };
    image.onerror = () => {
      reject();
    };
  });
}
function useBase64Image(type) {
  const imgSrc = Base64ImageMap.get(type);
  const data = reactive({
    src: null,
    finished: false
  });
  const getImage = async () => {
    const base64 = localStorage.getItem(type);
    if (isValidBase64Image(base64)) {
      data.src = base64;
      data.finished = true;
    }
    try {
      const base642 = await loadImageAndTRansferToBase64(imgSrc);
      setImageToStorage(base642);
      data.src = base642;
    } catch {
      data.src = imgSrc;
    }
    data.finished = true;
  };
  const setImageToStorage = (base64Data) => {
    if (isValidBase64Image(base64Data)) {
      localStorage.setItem(type, base64Data);
    }
  };
  getImage();
  return { data, getImage, setImageToStorage };
}
const _hoisted_1$1 = { class: "content flex flex-1 full-width" };
const _hoisted_2$1 = { class: "white-page-content full-height" };
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "baseWhitePage",
  setup(__props) {
    const { appStore } = useGlobalStore();
    const { data } = useBase64Image(
      appStore.isDarkMode ? UseBase64Images.LOGIN_BG_DARK : UseBase64Images.LOGIN_BG
    );
    const containerStyle = computed(() => {
      return {
        backgroundImage: `url(${data.src})`
      };
    });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", {
        class: normalizeClass({ "container flex full-height": true, "dark-mode": unref(appStore).isDarkMode })
      }, [
        createBaseVNode("div", _hoisted_1$1, [
          unref(data).finished ? (openBlock(), createElementBlock("div", {
            key: 0,
            class: "white-page-container bg-default",
            style: normalizeStyle(containerStyle.value)
          }, [
            createBaseVNode("div", _hoisted_2$1, [
              renderSlot(_ctx.$slots, "default", {}, void 0, true)
            ])
          ], 4)) : createCommentVNode("", true)
        ])
      ], 2);
    };
  }
});
const BaseWhitePage = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-21a59271"]]);
const logoSrc = "" + new URL("logo-primary-I58qFnBR.svg", import.meta.url).href;
const _hoisted_1 = { class: "auth-form-container" };
const _hoisted_2 = { class: "login-form" };
const _hoisted_3 = { class: "title-container" };
const _hoisted_4 = ["src"];
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "loginPage",
  setup(__props) {
    const formRef = ref();
    const { handleValidate } = pe();
    const router = useRouter();
    const formState = reactive({
      user: "",
      passwd: ""
    });
    const formRules = computed(() => {
      const rule = {
        user: [{ required: true, message: "Please enter your username" }],
        passwd: [
          { required: true, message: "Please enter your password" },
          { min: 5, max: 63, message: "Password must be between 5 and 63 characters" }
        ]
      };
      return rule;
    });
    const handleSubmit = () => {
      formRef.value?.validate().then(() => {
        if (formState.passwd === "admin") {
          setLogin();
          router.push("/");
        } else {
          api.error("Incorrect password");
        }
      });
    };
    return (_ctx, _cache) => {
      return openBlock(), createBlock(BaseWhitePage, null, {
        default: withCtx(() => [
          createBaseVNode("div", _hoisted_1, [
            createBaseVNode("div", _hoisted_2, [
              createBaseVNode("div", _hoisted_3, [
                createBaseVNode("img", {
                  src: unref(logoSrc),
                  width: "64",
                  alt: ""
                }, null, 8, _hoisted_4),
                _cache[1] || (_cache[1] = createBaseVNode("div", { class: "title" }, "Admin Password", -1))
              ]),
              createVNode(unref(Form), {
                ref_key: "formRef",
                ref: formRef,
                style: { "width": "360px" },
                "validate-trigger": ["change", "blur"],
                class: "dense-form",
                "label-align": "left",
                colon: false,
                rules: formRules.value,
                model: formState,
                "hide-required-mark": "",
                onValidate: unref(handleValidate)
              }, {
                default: withCtx(() => [
                  createVNode(unref(FormItem), { name: "passwd" }, {
                    default: withCtx(() => [
                      createVNode(unref(ho), {
                        value: formState.passwd,
                        "onUpdate:value": _cache[0] || (_cache[0] = ($event) => formState.passwd = $event),
                        placeholder: "Enter Password",
                        "use-default-validate-rule": false,
                        size: "small",
                        name: "passwd",
                        onPressEnter: handleSubmit
                      }, null, 8, ["value"])
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              }, 8, ["rules", "model", "onValidate"]),
              createVNode(unref(Button), {
                size: "large",
                class: "operation-btn full-width",
                shape: "round",
                type: "primary"
              }, {
                default: withCtx(() => _cache[2] || (_cache[2] = [
                  createTextVNode("Log In", -1)
                ])),
                _: 1,
                __: [2]
              })
            ])
          ])
        ]),
        _: 1
      });
    };
  }
});
const loginPage = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-a3d5a4a0"]]);
export {
  loginPage as default
};
