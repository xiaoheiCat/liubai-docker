<script setup lang="ts">
import type { LiuAppType } from '~/types/types-atom';
import type { PropType } from 'vue';
import { appMap } from '../tools/app-map';
import { useI18n } from 'vue-i18n';

defineProps({
  appType: {
    type: String as PropType<LiuAppType>,
    required: true,
  }
})

const { t } = useI18n()

defineEmits(["agree"])

</script>
<template>

  <div class="liu-mc-box">

    <!-- logos and check -->
    <div class="av-logos">
      <div class="av-logo-box">
        <div class="av-our-logo-bg"></div>
      </div>

      <div class="av-connector">
        <div class="av-dash"></div>
        <div class="av-check-circle">
          <svg-icon class="av-check-svg" 
            name="check"
            color="var(--bg-color)"
          ></svg-icon>
        </div>
      </div>

      <div class="av-logo-box">
        <svg-icon class="av-other-logo-svg"
          name="logos-windsurf"
          :coverFillStroke="false"
        ></svg-icon>
      </div>

    </div>

    <!-- title -->
    <div class="liu-no-user-select av-title">
      <span>{{ t('authorize.title_1', { app: appMap[appType] }) }}</span>
    </div>

    <!-- description -->
    <div class="av-desc">
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
  width: 90%;
  height: 90%;
  background-image: url('/logos/logo_256x256_v3.png');
}

.av-connector {
  position: relative;
  width: 150px;
  display: flex;
  align-items: center;
}

.av-dash {
  width: 100%;
  height: 2px;
  background-image: linear-gradient(to right, var(--main-note) 50%, transparent 50%);
  background-size: 8px 100%;
  background-repeat: repeat-x;
}

.av-check-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  background: #238636;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.av-check-svg {
  width: 20px;
  height: 20px;
}

.av-other-logo-svg {
  width: 100%;
  height: 100%;
}

.av-title {
  margin-block-end: min(5%, 24px);
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
@media screen and (max-width: 450px) {

  .av-logo-box {
    width: 80px;
    height: 80px;
  }

  .av-connector {
    width: 100px;
  }
}


</style>