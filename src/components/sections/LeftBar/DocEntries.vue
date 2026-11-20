<script setup lang="ts">
import DocEntryItem from "@/components/sections/LeftBar/DocEntryItem.vue";
import ScrollArea from "@/components/shared/ScrollArea.vue";
import { useEditorAction } from "@/actions/editorAction";
import { useEditorStore } from "@/stores/editorStore";
import { useDocSvc } from "@/services/document";
import { useFdSvc } from "@/services/folder";
import { DocEntry, DocType } from "@/types/doc";
import { typedDocDefaults } from "@/utils/docDefaults";
import { storeToRefs } from "pinia";
import Drag from "vuedraggable";
import Archive from "@/components/icons/Archive.vue";
import Plus from "@/components/icons/Plus.vue";
import DocIcon from "@/components/icons/Doc.vue";
import MindmapIcon from "@/components/icons/Mindmap.vue";
import FlowchartIcon from "@/components/icons/Flowchart.vue";
import { autoUpdate, flip, offset, useFloating } from "@floating-ui/vue";
import { onClickOutside } from "@vueuse/core";
import { type Component, computed, ref, useTemplateRef } from "vue";
import {
  notifyArchiveChanged,
  notifyDocChanged,
} from "@/infrastructure/api/windowEvent";

const store = useEditorStore();
const { docEntries, name, id, archiveId } = storeToRefs(store);
const docSvc = useDocSvc();
const fdSvc = useFdSvc();

const { openDocById } = useEditorAction();

// 统一走 openDocById：序号守卫保证快速连续点击时只有最后一次切换生效，
// 且切换前会先落库旧文档的挂起编辑
const openEntry = (entry: DocEntry) => openDocById(entry.id);

const { setDocEntries } = store;

// 悬浮高亮与拖拽锁提升到列表级，item 保持纯展示。
// 拖拽锁：vuedraggable 拖拽结束会重排 DOM，鼠标未动却会对换位后的元素触发虚假
// mouseenter，误激活相邻项的悬浮高亮。dragend 时加锁，锁住期间的第一次
// mouseenter 仅解锁不激活，吞掉这次虚假事件
const locked = ref(false);
const hoverId = ref<string>("");

const handleEnter = (id: string) => {
  if (locked.value) {
    locked.value = false;
    return;
  }
  hoverId.value = id;
};

// 拖拽结束持久化新顺序：vuedraggable 已通过 :list 原地更新 docEntries，此处写库后
// 广播 archive:changed（归档内文档排序属归档成员关系域），其他窗口按需刷新
const dragEnd = async () => {
  locked.value = true;
  if (!archiveId.value) return;
  await fdSvc.reorderDocs({
    folderId: archiveId.value,
    documentIds: docEntries.value.map((e) => e.id),
  });
};

// 在当前归档下创建文档：加入归档 → 刷新左侧目录 → 在已打开的编辑区展示新文档
const createDoc = async (newType: DocType) => {
  try {
    if (!archiveId.value) return;
    const docId = await docSvc.create({
      doc_type: newType,
      ...typedDocDefaults(newType),
    });
    await fdSvc.addDocToFolder({ folderId: archiveId.value, docId });
    setDocEntries(await fdSvc.getArchiveDocEntries({ id: archiveId.value }));
    await openDocById(docId);
    // 动了两个域：新建文档本体广播 doc:changed，归入归档广播 archive:changed
    notifyDocChanged();
    notifyArchiveChanged();
  } catch (e) {
    console.error(e);
  }
};

// 点击关闭：仅将文档移出当前归档（不删除文档本体），并刷新左侧目录
const removeEntry = async (entry: DocEntry) => {
  try {
    if (!archiveId.value) return;
    await fdSvc.removeDocFromFolder({
      folderId: archiveId.value,
      docId: entry.id,
    });
    notifyArchiveChanged();
    setDocEntries(await fdSvc.getArchiveDocEntries({ id: archiveId.value }));
    // 若移出的正是当前打开的文档，则切换到列表中的第一个文档并加载（无则清空编辑区）
    if (id.value === entry.id) {
      const next = docEntries.value[0];
      await openDocById(next ? next.id : null);
    }
  } catch (e) {
    console.error(e);
  }
};

const show = ref<boolean>(false);
const floating = useTemplateRef("floating");
const target = useTemplateRef("target");

const { floatingStyles } = useFloating(target, floating, {
  placement: "bottom-end",
  middleware: [flip(), offset(8)],
  whileElementsMounted: autoUpdate,
});

onClickOutside(
  floating,
  () => {
    show.value = false;
  },
  { ignore: [computed(() => target.value)] },
);

interface PopoverListItem {
  icon: Component;
  text: string;
  action: () => void;
}

const popoverList: PopoverListItem[] = [
  {
    icon: DocIcon,
    text: "富文本",
    action: () => {
      createDoc("richText");
      show.value = false;
    },
  },
  {
    icon: MindmapIcon,
    text: "思维导图",
    action: () => {
      createDoc("mindMap");
      show.value = false;
    },
  },
  {
    icon: FlowchartIcon,
    text: "流程图",
    action: () => {
      createDoc("flowChart");
      show.value = false;
    },
  },
];

const handleClickBtn = () => {
  show.value = !show.value;
};
</script>

<template>
  <div
    class="h-11 shrink-0 flex items-center pl-[18px] pr-4 gap-1.5 border-b border-gray-100"
  >
    <Archive class="size-4 shrink-0 text-gray-400" />
    <span class="flex-1 min-w-0 truncate">{{ name }}</span>
    <!-- pr-4 使添加按钮图标中心（16+14=30px）与条目删除按钮图标中心
         （列表 px-2 + 条目 px-2.5 + size-6 按钮 + size-3.5 图标 = 18+12=30px）垂直对齐 -->
    <!-- 添加按钮（全应用统一规格，本处为范本）：ghost 风格，无背景 hover 显灰底；
         颜色类放按钮上、图标以 currentColor 继承 -->
    <div
      ref="target"
      class="size-7 shrink-0 grid place-items-center rounded-md cursor-pointer text-gray-500 hover:text-gray-700"
      :class="show ? 'bg-gray-100' : 'hover:bg-gray-100'"
      @click="handleClickBtn"
    >
      <Plus class="size-4" />
    </div>
  </div>
  <div
    v-if="show"
    ref="floating"
    class="bg-white z-10 select-none text-xs rounded-lg overflow-hidden p-1 shadow-2xl"
    :style="floatingStyles"
  >
    <div
      v-for="i in popoverList"
      class="pl-4 pr-8 py-2 flex items-center gap-2 rounded-md hover:bg-gray-100"
      @click="i.action()"
    >
      <component :is="i.icon" class="size-4" />
      <span>{{ i.text }}</span>
    </div>
  </div>
  <ScrollArea class="flex-1 min-h-0 px-2 py-2">
    <Drag
      :list="docEntries"
      ghost-class="ghost1"
      :animation="200"
      item-key="id"
      @end="dragEnd"
    >
      <template #item="{ element }: { element: DocEntry }">
        <DocEntryItem
          :entry="element"
          :active="id === element.id"
          :hovered="hoverId === element.id"
          @mouseenter="handleEnter(element.id)"
          @mouseleave="hoverId = ''"
          @open="openEntry(element)"
          @remove="removeEntry(element)"
        />
      </template>
    </Drag>
  </ScrollArea>
</template>
