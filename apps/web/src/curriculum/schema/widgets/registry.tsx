import CheckboxWidget from "@/curriculum/schema/widgets/CheckboxWidget";
import RepeatableListWidget from "@/curriculum/schema/widgets/RepeatableListWidget";
import SelectWidget from "@/curriculum/schema/widgets/SelectWidget";
import TextAreaWidget from "@/curriculum/schema/widgets/TextAreaWidget";
import TextWidget from "@/curriculum/schema/widgets/TextWidget";

export const WIDGET_REGISTRY = {
  text: TextWidget,
  textarea: TextAreaWidget,
  select: SelectWidget,
  checkbox: CheckboxWidget,
  repeatable_list: RepeatableListWidget,
};
