<script setup lang="ts">
import { useI18n } from 'vue-i18n';

defineProps({
  iconName: {
    type: String,
  },
  hd: {
    type: String,
    required: true,
  },
  bd: {
    type: String,
  },
  wechatLogo: {
    type: Boolean,
  }
})

const { t } = useI18n()
const iconColor = "var(--main-normal)"

</script>
<template>

  <div class="ac-logo">
    <svg-icon v-if="iconName" 
      :name="iconName" class="ac-logo-icon" :cover-fill-stroke="false"
    ></svg-icon>
    <div v-else-if="wechatLogo" class="ac-logo-image ac-logo-wechat"></div>
  </div>

  <div class="aci-info">
    <div class="aci-hd">
      <span>{{ hd }}</span>
    </div>
    <div class="aci-bd" v-if="bd">
      <span>{{ bd }}</span>
    </div>
    <div class="aci-bd aci-bd_not_yet" v-else>
      <span>{{ t('setting.not_yet_bound') }}</span>
    </div>
  </div>

  <div class="aci-footer">
    <svg-icon name="arrow-right2" :color="iconColor" class="aci-footer-arrow"></svg-icon>
  </div>


</template>
<style scoped lang="scss">

.ac-logo {
  width: 32px;
  height: 32px;
  margin-inline-end: 16px;
  position: relative;

  .ac-logo-icon {
    width: 100%;
    height: 100%;
  }

  .ac-logo-image {
    width: 100%;
    height: 100%;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  }

  .ac-logo-wechat {
    background-image: url('/images/third-party/wechat.png');
  }
}

.aci-info {
  flex: 3;
  position: relative;
}

.aci-hd {
  font-size: var(--desc-font);
  font-weight: 700;
  color: var(--main-normal);
  margin-block-end: 2px;
}

.aci-bd {
  font-size: var(--mini-font);
  color: var(--main-code);
}

.aci-bd_not_yet {
  color: var(--main-tip);
  font-style: italic;
}

.aci-footer {
  flex: 1;
  position: relative;
  display: flex;
  justify-content: flex-end;
}

.aci-footer-arrow {
  width: 20px;
  height: 20px;
}

</style>