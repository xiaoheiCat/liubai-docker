<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useCotPage } from './tools/useCotPage'

const { cpData } = useCotPage()
const { t } = useI18n()

</script>
<template>

  <div class="liu-simple-page">

    <div class="liu-mc-container">

      <PlaceholderView :p-state="cpData.pageState"></PlaceholderView>

      <div v-if="cpData.pageState < 0" class="liu-mc-box">

        <div class="cp-reasoning-box">
          <span class="liu-selection">{{ cpData.reasoningContent }}</span>
        </div>
        
      </div>

    </div>
  </div>
</template>
<style scoped>

.cp-reasoning-box {
  padding: 32px 0 60px;
  font-size: var(--desc-font);
  color: var(--main-code);
  word-wrap: break-word;
  white-space: pre-wrap;
  line-height: 1.6;
}

</style>