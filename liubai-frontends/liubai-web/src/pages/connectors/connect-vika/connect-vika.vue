<script setup lang="ts">
import PageDefault from "~/pages/shared/page-default/page-default.vue";
import { useI18n } from "vue-i18n";
import { useConnectVika } from "./tools/useConnectVika"

const { t } = useI18n()
const { 
  cwData,
  onBackupChanged,
  onBackupInput,
  onTapSave,
  onTapConfigMethod,
} = useConnectVika()

</script>
<template>

  <PageDefault title-key="connect.vika">

    <PlaceholderView
      :p-state="cwData.pageState"
    ></PlaceholderView>

    <div class="cw-container" v-if="cwData.pageState < 0">

      <div class="cw-bar">
        <div class="liu-no-user-select cwb-title">
          <span>{{ t('connect.vika_backup') }}</span>
        </div>

        <div class="liu-no-user-select cwb-footer">
          <liu-switch 
            :checked="cwData.backup_toggle"
            @change="onBackupChanged($event.checked)"
          ></liu-switch>
        </div>

      </div>

      <div class="cw-desc">
        <span class="liu-selection">{{ t('connect.vika_backup_desc') }}</span>
      </div>

      <!-- show if toggle is true -->
      <div class="cw-panel" v-if="cwData.backup_toggle">

        <!-- API Token -->
        <div class="liu-no-user-select cw-question">
          <span>API Token</span>
        </div>
        <input type="text" 
          v-model="cwData.api_token" 
          class="ph-no-capture cw-answer" 
          :placeholder="t('connect.vika_apitoken_ph')"
          @input="onBackupInput"
          maxlength="48"
        />

        <!-- Datasheet id -->
        <div class="liu-no-user-select cw-question">
          <span>Datasheet Id</span>
        </div>
        <input type="text" 
          v-model="cwData.datasheet_id" 
          class="ph-no-capture cw-answer" 
          :placeholder="t('connect.vika_datasheet_ph')"
          @input="onBackupInput"
          maxlength="48"
        />

        <!-- buttons -->
        <div class="cw-btns">
          <custom-btn 
            size="mini" 
            type="transparent"
            @click="onTapConfigMethod"
          >
            <span>{{ t('connect.check_config') }}</span>
          </custom-btn>
          <custom-btn 
            size="mini" 
            class="cw-save-btn"
            :disabled="!cwData.canSave"
            :is-loading="cwData.isSaving"
            @click="onTapSave"
          >
            <span>{{ t('common.save') }}</span>
          </custom-btn>
        </div>

      </div>
      

    </div>

  </PageDefault>

</template>
<style scoped lang="scss">
@use "../shared/connect-layout.scss";

</style>