<!--
 * @Author: shufei.han
 * @Date: 2024-11-26 11:11:38
 * @LastEditors: shufei.han
 * @LastEditTime: 2025-02-12 16:44:35
 * @FilePath: \gl-kvm-frontend\src\views\404\noPermissionPage.vue
 * @Description: 404页面
-->
<template>
    <div class="wscn-http404-container bg-default">
        <div class="wscn-http404">
            <div class="info">
                <div class="info-sorry">
                    <span>{{ $t("common.sorry") }}</span>
                </div>

                <div class="info-text">
                    <span
                    >{{ $t("common.pageMissing") }}<br />{{
                        $t("common.fix")
                    }}</span
                    >
                </div>

                <div class="info-btn">
                    <Button type="primary" @click="goHomeFn">
                        {{ $t("common.backHomepage") }}
                    </Button>

                    <Button class="refresh" @click="refreshFn">
                        {{ $t("common.tryRefresh") }}
                    </Button>
                </div>
            </div>

            <div class="image">
                <img class="img-block" :src="image404" alt="404" />
            </div>
        </div>
        <!-- 800px -->
        <div class="wscn-http404-800">
            <div class="image">
                <img class="img-block" :src="image404" alt="404" />
            </div>
            <div class="info">
                <div class="info-sorry">
                    <span>{{ $t("common.sorry") }}</span>
                </div>

                <div class="info-text">
                    <span
                    >{{ $t("common.pageMissing") }}<br />{{
                        $t("common.fix")
                    }}</span
                    >
                </div>

                <div class="info-btn">
                    <Button type="primary" @click="goHomeFn">
                        {{ $t("common.backHomepage") }}
                    </Button>

                    <Button class="refresh" @click="refreshFn">
                        {{ $t("common.tryRefresh") }}
                    </Button>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import image404 from '@renderer/assets/svg/404.svg'
import { Button } from 'ant-design-vue'

const refreshFn = () => location.reload()
const goHomeFn = () => {
    window.location.href = window.location.origin
}
</script>

<style lang="scss" scoped>
.wscn-http404-container {
    min-width: 100vw;
    min-height: 100vh;
    display: flex;
    align-items: center;
    .info {
        .info-sorry {
            color: var(--gl-color-brand-primary);
            line-height: 36px;
            font-weight: 500;
        }

        .info-text {
            font-weight: 400;
        }

        .refresh {
            margin-left: 24px;
        }
    }
    .img-block {
        width: 100%;
        display: block;
    }
}

@media (min-width: 1366px) {
    .wscn-http404-800 {
        display: none;
    }
    .wscn-http404 {
        width: 100%;
        display: flex;
        justify-content: center;
        .info {
            width: 440px;
            margin-right: 64px;
            .info-sorry {
                height: 58px;
                font-size: 48px;
            }
            .info-text {
                font-size: 24px;
                color: var(--gl-color-text-level1);
                line-height: 36px;
                margin: 20px 0 60px 0;
            }
        }
        .image {
            width: 400px;
            height: 290px;
        }
    }
}

@media (max-width: 1365px) {
    .wscn-http404 {
        display: none;
    }
    .wscn-http404-container {
        display: flex;
        justify-content: center;
        .wscn-http404-800 {
            width: 360px;
            .image {
                margin: 0 auto;
                width: 160px;
                height: 116px;
            }
            .info {
                .info-sorry {
                    margin: 20px 0;
                    height: 48px;
                    font-size: 40px;
                    text-align: center;
                }
                .info-text {
                    font-size: 20px;
                    text-align: center;
                    color: var(--gl-color-text-level2);
                    line-height: 30px;
                }
                .info-btn {
                    margin-top: 60px;
                    display: flex;
                    justify-content: center;
                }
            }
        }
    }
}
</style>
