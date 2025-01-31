<script setup lang="ts">
import type { LiuAppType } from '~/types/types-atom';
import type { PropType } from 'vue';
import { appMap } from '../tools/app-map';
import { useI18n } from 'vue-i18n';
import { useSystemStore } from '~/hooks/stores/useSystemStore';
import { storeToRefs } from 'pinia';
import { useAuthorizeView } from './tools/useAuthorizeView';

const props = defineProps({
  appType: {
    type: String as PropType<LiuAppType>,
    required: true,
  },
  code: {
    type: String,
  }
})
defineEmits(["agree"])

const { t } = useI18n()

const systemStore = useSystemStore()
const { supported_theme: theme } = storeToRefs(systemStore)

const { showCode } = useAuthorizeView(props)

</script>
<template>

  <div class="liu-mc-box">

    <!-- logos and check (or arrow) -->
    <div class="av-logos">
      <div class="av-logo-box">
        <div class="av-our-logo-bg"></div>
      </div>

      <div class="av-connector">
        <div class="av-dash" :class="{ 'av-dash_moving': code }"></div>

        <div class="av-check-circle">
          <svg-icon v-if="code" class="av-arrow-svg" 
            name="arrow-back"
            color="var(--bg-color)"
          ></svg-icon>
          <svg-icon v-else class="av-check-svg" 
            name="check"
            color="var(--bg-color)"
          ></svg-icon>
        </div>
      </div>

      <div class="av-logo-box"
        :class="{ 'av-logo-box_windsurf': appType === 'windsurf' }"
      >
        <svg-icon v-if="appType === 'cursor'"  class="av-cursor-svg"
          :name="theme === 'dark' ? 'logos-cursor_dark' : 'logos-cursor'"
          :coverFillStroke="false"
        ></svg-icon>
        <svg-icon v-else-if="appType === 'github.dev'"  class="av-logo-svg"
          name="logos-github"
        ></svg-icon>
        <svg-icon v-else-if="appType === 'gitpod.io'"  class="av-gitpod-svg"
          name="logos-gitpod"
          :coverFillStroke="false"
        ></svg-icon>
        <svg-icon v-else-if="appType === 'project-idx'"  class="av-project-idx-svg"
          name="logos-project-idx"
          :coverFillStroke="false"
        ></svg-icon>
        <svg-icon v-else-if="appType === 'stackblitz.com'"  class="av-stackblitz-svg"
          name="logos-stackblitz"
          :coverFillStroke="false"
        ></svg-icon>
        <svg-icon v-else-if="appType === 'windsurf'"  class="av-windsurf-svg"
          name="logos-windsurf"
          :coverFillStroke="false"
        ></svg-icon>
        <svg-icon v-else-if="appType === 'vscodium'"  class="av-vscodium-svg"
          name="logos-vscodium"
          :coverFillStroke="false"
        ></svg-icon>
        <svg-icon v-else-if="appType === 'vscode-insiders'"  class="av-vscode-svg"
          name="logos-vscode-insiders"
          :coverFillStroke="false"
        ></svg-icon>
        <svg-icon v-else  class="av-vscode-svg"
          name="logos-vscode"
          :coverFillStroke="false"
        ></svg-icon>
      </div>

    </div>

    <!-- title -->
    <div v-if="code" class="liu-no-user-select av-title">
      <span>{{ t('authorize.opening_title', { app: appMap[appType] }) }}</span>
    </div>
    <div v-else class="liu-no-user-select av-title">
      <span>{{ t('authorize.title_1', { app: appMap[appType] }) }}</span>
    </div>

    <!-- description -->
    <div v-if="code" class="av-desc">
      <span v-if="showCode" class="liu-selection">{{ t('authorize.opening_tip_2', { app: appMap[appType], code }) }}</span>
      <span v-else class="liu-selection">{{ t('authorize.opening_tip_1', { app: appMap[appType] }) }}</span>
    </div>
    <div v-else class="av-desc">
      <span class="liu-selection">{{ t('authorize.desc_1', { app: appMap[appType] }) }}</span>
    </div>


  </div>


</template>
<style scoped lang="scss">

.liu-mc-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  height: 100dvh;
}

.av-logos {
  height: 100px;
  position: relative;
  margin-block-end: min(10%, 50px);
  display: flex;
  align-items: center;
}

.av-logo-box {
  overflow: hidden;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  position: relative;
  background-color: var(--card-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.av-our-logo-bg {
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  width: 80%;
  height: 80%;
  background-image: url('/logos/logo_256x256_v3.png');
}

.av-connector {
  position: relative;
  width: 150px;
  display: flex;
  align-items: center;
}

@keyframes moveRight {
  from {
    background-position: 0 0;
  }
  to {
    background-position: 16px 0;
  }
}

.av-dash {
  width: 100%;
  height: 2px;
  background-image: linear-gradient(to right, var(--main-note) 50%, transparent 50%);
  background-size: 8px 100%;
  background-repeat: repeat-x;
}

.av-dash_moving {
  animation: moveRight 1s linear infinite;
}

.av-check-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  background-color: var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.av-check-svg {
  width: 20px;
  height: 20px;
}

.av-arrow-svg {
  width: 20px;
  height: 20px;
  transform: rotate(180deg);
}

.av-logo-box_windsurf {
  background-color: #191A1A;
}

.av-logo-svg {
  width: 80%;
  height: 80%;
}

.av-cursor-svg, .av-vscodium-svg {
  width: 70%;
  height: 70%;
}

.av-gitpod-svg, .av-stackblitz-svg, .av-project-idx-svg {
  width: 66%;
  height: 66%;
}

.av-windsurf-svg {
  width: 38%;
  height: 100%;
}

.av-vscode-svg {
  width: 60%;
  height: 60%;
}


.av-title {
  margin-block-end: min(5%, 20px);
  text-align: center;
  text-wrap: pretty;
  font-size: var(--head-font);
  color: var(--main-normal);
  font-weight: 700;
  max-width: 600px;
}

.av-desc {
  margin-block-end: min(10%, 50px);
  text-align: center;
  text-wrap: pretty;
  font-size: var(--desc-font);
  color: var(--main-normal);
  max-width: 750px;
}


/** for mobile */
@media screen and (max-width: 490px) {

  .av-logo-box {
    width: 80px;
    height: 80px;
  }

  .av-connector {
    width: 100px;
  }
}


</style>