import { e as defineComponent, m as createElementBlock, p as createBaseVNode, x as toDisplayString, t as createTextVNode, j as createVNode, w as withCtx, u as unref, N as Button, o as openBlock } from "./index-DpmXzz-i.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
const image404 = "" + new URL("404-YLuQvuVp.svg", import.meta.url).href;
const _hoisted_1 = { class: "wscn-http404-container bg-default" };
const _hoisted_2 = { class: "wscn-http404" };
const _hoisted_3 = { class: "info" };
const _hoisted_4 = { class: "info-sorry" };
const _hoisted_5 = { class: "info-text" };
const _hoisted_6 = { class: "info-btn" };
const _hoisted_7 = { class: "image" };
const _hoisted_8 = ["src"];
const _hoisted_9 = { class: "wscn-http404-800" };
const _hoisted_10 = { class: "image" };
const _hoisted_11 = ["src"];
const _hoisted_12 = { class: "info" };
const _hoisted_13 = { class: "info-sorry" };
const _hoisted_14 = { class: "info-text" };
const _hoisted_15 = { class: "info-btn" };
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "noPermissionPage",
  setup(__props) {
    const refreshFn = () => location.reload();
    const goHomeFn = () => {
      window.location.href = window.location.origin;
    };
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createBaseVNode("div", _hoisted_2, [
          createBaseVNode("div", _hoisted_3, [
            createBaseVNode("div", _hoisted_4, [
              createBaseVNode("span", null, toDisplayString(_ctx.$t("common.sorry")), 1)
            ]),
            createBaseVNode("div", _hoisted_5, [
              createBaseVNode("span", null, [
                createTextVNode(toDisplayString(_ctx.$t("common.pageMissing")), 1),
                _cache[0] || (_cache[0] = createBaseVNode("br", null, null, -1)),
                createTextVNode(toDisplayString(_ctx.$t("common.fix")), 1)
              ])
            ]),
            createBaseVNode("div", _hoisted_6, [
              createVNode(unref(Button), {
                type: "primary",
                onClick: goHomeFn
              }, {
                default: withCtx(() => [
                  createTextVNode(toDisplayString(_ctx.$t("common.backHomepage")), 1)
                ]),
                _: 1
              }),
              createVNode(unref(Button), {
                class: "refresh",
                onClick: refreshFn
              }, {
                default: withCtx(() => [
                  createTextVNode(toDisplayString(_ctx.$t("common.tryRefresh")), 1)
                ]),
                _: 1
              })
            ])
          ]),
          createBaseVNode("div", _hoisted_7, [
            createBaseVNode("img", {
              class: "img-block",
              src: unref(image404),
              alt: "404"
            }, null, 8, _hoisted_8)
          ])
        ]),
        createBaseVNode("div", _hoisted_9, [
          createBaseVNode("div", _hoisted_10, [
            createBaseVNode("img", {
              class: "img-block",
              src: unref(image404),
              alt: "404"
            }, null, 8, _hoisted_11)
          ]),
          createBaseVNode("div", _hoisted_12, [
            createBaseVNode("div", _hoisted_13, [
              createBaseVNode("span", null, toDisplayString(_ctx.$t("common.sorry")), 1)
            ]),
            createBaseVNode("div", _hoisted_14, [
              createBaseVNode("span", null, [
                createTextVNode(toDisplayString(_ctx.$t("common.pageMissing")), 1),
                _cache[1] || (_cache[1] = createBaseVNode("br", null, null, -1)),
                createTextVNode(toDisplayString(_ctx.$t("common.fix")), 1)
              ])
            ]),
            createBaseVNode("div", _hoisted_15, [
              createVNode(unref(Button), {
                type: "primary",
                onClick: goHomeFn
              }, {
                default: withCtx(() => [
                  createTextVNode(toDisplayString(_ctx.$t("common.backHomepage")), 1)
                ]),
                _: 1
              }),
              createVNode(unref(Button), {
                class: "refresh",
                onClick: refreshFn
              }, {
                default: withCtx(() => [
                  createTextVNode(toDisplayString(_ctx.$t("common.tryRefresh")), 1)
                ]),
                _: 1
              })
            ])
          ])
        ])
      ]);
    };
  }
});
const noPermissionPage = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-0a933963"]]);
export {
  noPermissionPage as default
};
