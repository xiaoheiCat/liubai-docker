<script setup lang="ts">
import { useAuthorizePage } from './tools/useAuthorizePage';
import AuthorizeView from './authorize-view/authorize-view.vue';

const { 
  apData,
  onTapAgree,
} = useAuthorizePage()

</script>
<template>
  <div class="liu-simple-page">

    <div class="liu-mc-container">

      <PlaceholderView :p-state="apData.pageState"></PlaceholderView>
      
      <AuthorizeView v-if="apData.appType"
        :app-type="apData.appType"
        :code="apData.code"
        @agree="onTapAgree"
      ></AuthorizeView>
      

      
    </div>


  </div>

</template>
<style scoped lang="scss"></style>