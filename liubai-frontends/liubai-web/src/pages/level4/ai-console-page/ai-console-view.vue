<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import cui from '~/components/custom-ui';

const voicePreference = defineModel("voicePreference")

const { t } = useI18n()
const onTapVoiceInfo = () => {
  cui.showModal({
    title: "🗣️",
    content_key: "ai_console.voice_tip",
    isTitleEqualToEmoji: true,
    showCancel: false,
    confirm_key: "tip.got_it",
  })
}

</script>
<template>

  <div class="ac-spacing"></div>

  <div class="ac-box">  

    <!-- Voice Preference -->
    <div class="ac-bar">

      <div class="ac-title">
        <span class="liu-no-user-select">{{ t('ai_console.voice_preference') }}</span>
        <div class="ac-info-box" @click.stop="onTapVoiceInfo">
          <SvgIcon name="info" class="ac-info-icon"
            color="var(--main-note)"
          ></SvgIcon>
        </div>
        
      </div>

      <div class="liu-no-user-select ac-footer">
        <select v-model="voicePreference" class="ac-select">
          <option value="male">{{ t('ai_console.male') }}</option>
          <option value="female">{{ t('ai_console.female') }}</option>
        </select>
      </div>

    </div>

  </div>
</template>
<style scoped lang="scss">

.ac-spacing {
  width: 100%;
  height: 24px;
}

.ac-box {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  background-color: var(--card-bg);
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--card-shadow-2);
  transition: .15s;
}

.ac-bar {
  width: 100%;
  display: flex;
  align-items: center;
  position: relative;
  padding-block-end: 8px;
}

.ac-title {
  flex: 3;
  font-size: var(--title-font);
  color: var(--main-normal);
  font-weight: 700;
  display: inline-flex;
}

.ac-info-box {
  width: 20px;
  height: 20px;
  padding-block-start: 2px;
  padding-inline: 8px 4px;
  position: relative;
  box-sizing: content-box;
  cursor: pointer;
  transition: .15s;
}

.ac-info-icon {
  width: 100%;
  height: 100%;
}

.ac-footer {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.ac-select {
  font-size: var(--btn-font);
  color: var(--main-text);
  margin: 0.1rem;
  border: 1px solid var(--line-default);
  border-radius: 0.3rem;
  padding: 6px 18px;
  background: var(--card-bg);
  accent-color: var(--main-text);
  user-select: none;
  -webkit-user-select: none;
  cursor: pointer;
  appearance: auto;
  outline: none;
}

/** if container query is not supported yet */
@media screen and (max-width: 480px) {
  .ac-box {
    padding: 24px;
  }
}

@container liu-mc-container (max-width: 480px) {
  .ac-box {
    padding: 24px;
  }
}

@media(hover: hover) {
  .ac-info-box:hover {
    opacity: .77;
  }

}

</style>