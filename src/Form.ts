import Vue, { VNode, CreateElement } from 'vue';
import { ValidationProvider, ValidationObserver } from 'vee-validate';
import { normalizeEventValue } from './utils';

type FirstArgument<T> = T extends (arg: infer U, ...args: any[]) => any ? U : any;

interface Listeners {
  [k: string]: Function | Function[];
}

interface FormValue {
  [k: string]: any;
}

export interface FieldSchema {
  type: FirstArgument<CreateElement>;
  model?: string;
  rules?: string | { [k: string]: any };
  props?: { [k: string]: any };
  attrs?: { [k: string]: any };
}

export interface SubmitItem {
  type: 'submit';
  validate: boolean;
  attrs?: { [k: string]: any };
}

function isFormControl(item: FieldSchema | SubmitItem): item is SubmitItem {
  return item.type === 'submit';
}

function renderWithProvider(
  h: CreateElement,
  item: FieldSchema | SubmitItem,
  formValues: FormValue,
  listeners: Listeners,
  validate: Function
): VNode {
  const tag = item.type;
  if (isFormControl(item)) {
    return h(
      'button',
      {
        on: {
          click: () => {
            const normalized = Array.isArray(listeners.submit) ? listeners.submit : [listeners.submit];
            validate().then(() => {
              normalized.forEach(handler => {
                handler();
              });
            });
          }
        }
      },
      'Submit'
    );
  }

  const props = item.props ? item.props : {};
  let value = '';
  if (item.model && item.model in formValues) {
    value = formValues[item.model];
  }

  const attrs = item.attrs || {};
  props.value = value;
  attrs.value = value;

  return h(ValidationProvider, {
    props: {
      rules: item.rules || ''
    },
    scopedSlots: {
      default({ validate, errors }) {
        const onInput = (e: Event) => {
          const value = normalizeEventValue(e);
          validate(value);
          const model = item.model;
          if (!listeners.input || !model) {
            return;
          }

          const normalized = Array.isArray(listeners.input) ? listeners.input : [listeners.input];
          normalized.forEach(handler => {
            handler({ ...formValues, [model]: value });
          });
        };

        return [h(tag, { props, attrs, on: { input: onInput } }), h('span', errors[0])];
      }
    }
  });
}

function renderSchema(
  h: CreateElement,
  schema: (FieldSchema | SubmitItem)[],
  formValues: FormValue,
  listeners: Listeners,
  validate: Function
): VNode[] {
  const nodes = [];
  const length = schema.length;
  for (let i = 0; i < length; i++) {
    nodes.push(renderWithProvider(h, schema[i], formValues, listeners, validate));
  }

  return nodes;
}

const Form = Vue.extend({
  functional: true,
  props: {
    schema: {
      type: Array,
      required: true
    },
    value: {
      type: Object,
      default: () => {}
    }
  },
  render(h, { props, listeners }) {
    return h(ValidationObserver, {
      scopedSlots: {
        default({ validate }) {
          const children: VNode[] = renderSchema(h, props.schema as FieldSchema[], props.value, listeners, validate);

          return children;
        }
      }
    });
  }
});

export { Form };
