<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useAuthoizePage } from './tools/useAuthorizePage';
import AuthorizeView from './authorize-view/authorize-view.vue';

const { t } = useI18n()
const { apData } = useAuthoizePage()

</script>
<template>
  <div class="liu-simple-page">

    <div class="liu-mc-container">

      <PlaceholderView :p-state="apData.pageState"></PlaceholderView>
      
      <AuthorizeView v-if="apData.appType"
        :app-type="apData.appType"
      ></AuthorizeView>
      

      
    </div>


  </div>

</template>
<style scoped lang="scss"></style>