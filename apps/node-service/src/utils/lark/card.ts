/**
 * Lark Card Builder - 飞书卡片构建工具
 * 基于飞书 2.0 卡片规范构建交互式卡片
 */

// Card element type definitions
export interface LarkCardElement {
  tag: string;
  text?: {
    tag: string;
    content: string;
    text_size?: string;
    text_align?: string;
    text_color?: string;
  };
  margin?: string;
  [key: string]: unknown;
}

export interface LarkButton {
  tag: 'button';
  text: {
    tag: 'plain_text';
    content: string;
  };
  type: 'primary' | 'default' | 'danger' | 'primary_filled';
  url?: string;
  value?: Record<string, unknown>;
  confirm?: {
    title: { tag: 'plain_text'; content: string };
    text: { tag: 'plain_text'; content: string };
  };
  behaviors?: Array<{
    type: 'callback';
    value: Record<string, unknown>;
  }>;
  form_action_type?: 'submit';
  name?: string;
  element_id?: string;
}

export interface LarkInput {
  tag: 'input';
  placeholder: { tag: 'plain_text'; content: string };
  default_value?: string;
  width?: 'default' | 'fill' | 'auto';
  label?: { tag: 'plain_text'; content: string };
  label_position?: 'left' | 'top';
  name: string;
  margin?: string;
  element_id: string;
}

export interface LarkSelect {
  tag: 'select_static';
  placeholder: { tag: 'plain_text'; content: string };
  options: Array<{
    text: { tag: 'plain_text'; content: string };
    value: string;
    icon?: { tag: 'standard_icon'; token: string };
  }>;
  type?: 'default';
  width?: 'default' | 'fill' | 'auto';
  required?: boolean;
  name: string;
  margin?: string;
  element_id: string;
}

export interface LarkForm extends LarkCardElement {
  tag: 'form';
  elements: Array<LarkInput | LarkSelect | LarkCardElement | LarkButton>;
  direction?: 'vertical' | 'horizontal';
  padding?: string;
  margin?: string;
  name: string;
}

// Card configuration types
export interface LarkCardConfig {
  schema?: '2.0';
  update_multi?: boolean;
  style?: {
    text_size?: {
      normal_v2?: {
        default?: string;
        pc?: string;
        mobile?: string;
      };
    };
  };
}

export interface LarkCardHeader {
  title: { tag: 'plain_text'; content: string };
  subtitle?: { tag: 'plain_text'; content: string };
  template?: 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'orange';
  padding?: string;
}

export interface LarkCardBody {
  direction?: 'vertical' | 'horizontal';
  padding?: string;
  elements: LarkCardElement[];
}

export interface LarkCard {
  type: 'raw';
  data: {
    schema: '2.0';
    config: LarkCardConfig;
    header?: LarkCardHeader;
    body: LarkCardBody;
  };
}

/**
 * 飞书卡片构建器类
 */
export class LarkCardBuilder {
  private card: LarkCard;

  constructor() {
    this.card = {
      type: 'raw',
      data: {
        schema: '2.0',
        config: {
          update_multi: true,
          style: {
            text_size: {
              normal_v2: {
                default: 'normal',
                pc: 'normal',
                mobile: 'heading',
              },
            },
          },
        },
        body: {
          direction: 'vertical',
          padding: '12px 12px 12px 12px',
          elements: [],
        },
      },
    };
  }

  /**
   * 设置卡片标题
   */
  setHeader(
    title: string,
    subtitle?: string,
    template: 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'orange' = 'blue'
  ) {
    this.card.data.header = {
      title: { tag: 'plain_text', content: title },
      template,
      padding: '12px 12px 12px 12px',
    };

    if (subtitle) {
      this.card.data.header.subtitle = { tag: 'plain_text', content: subtitle };
    }

    return this;
  }

  /**
   * 添加文本元素
   */
  addText(
    content: string,
    options: {
      tag?: 'lark_md' | 'plain_text';
      text_size?: 'normal_v2' | 'heading' | 'notation';
      text_align?: 'left' | 'center' | 'right';
      text_color?: 'default' | 'red' | 'green' | 'blue' | 'orange';
      margin?: string;
    } = {}
  ) {
    const {
      tag = 'lark_md',
      text_size = 'normal_v2',
      text_align = 'left',
      text_color = 'default',
      margin = '0px 0px 8px 0px',
    } = options;

    this.card.data.body.elements.push({
      tag: 'div',
      text: {
        tag,
        content,
        text_size,
        text_align,
        text_color,
      },
      margin,
    });

    return this;
  }

  /**
   * 添加按钮组
   */
  addButtons(buttons: LarkButton[]) {
    if (buttons.length > 0) {
      this.card.data.body.elements.push({
        tag: 'column_set',
        horizontal_spacing: '8px',
        horizontal_align: 'left',
        columns: buttons.map(button => ({
          tag: 'column',
          width: 'weighted',
          elements: [button],
          vertical_spacing: '8px',
          horizontal_align: 'left',
          vertical_align: 'top',
        })),
      });
    }

    return this;
  }

  /**
   * 添加单个按钮
   */
  addButton(
    text: string,
    options: {
      type?: 'primary' | 'default' | 'danger' | 'primary_filled';
      url?: string;
      value?: Record<string, unknown>;
      confirm?: { title: string; text: string };
      action_type?: 'submit';
      name?: string;
      element_id?: string;
    } = {}
  ) {
    const button: LarkButton = {
      tag: 'button',
      text: { tag: 'plain_text', content: text },
      type: options.type || 'default',
    };

    if (options.url) button.url = options.url;
    if (options.value) button.value = options.value;
    if (options.name) button.name = options.name;
    if (options.element_id) button.element_id = options.element_id;

    if (options.confirm) {
      button.confirm = {
        title: { tag: 'plain_text', content: options.confirm.title },
        text: { tag: 'plain_text', content: options.confirm.text },
      };
    }

    if (options.action_type === 'submit') {
      button.form_action_type = 'submit';
      button.behaviors = [{ type: 'callback', value: {} }];
    }

    return this.addButtons([button]);
  }

  /**
   * 添加表单
   */
  addForm(
    formName: string,
    elements: Array<LarkInput | LarkSelect | LarkCardElement | LarkButton>
  ) {
    const form: LarkForm = {
      tag: 'form',
      elements,
      direction: 'vertical',
      padding: '4px 0px 4px 0px',
      margin: '0px 0px 0px 0px',
      name: formName,
    };

    this.card.data.body.elements.push(form);
    return this;
  }

  /**
   * 添加输入框
   */
  addInput(
    name: string,
    elementId: string,
    placeholder: string,
    options: {
      label?: string;
      label_position?: 'left' | 'top';
      default_value?: string;
      width?: 'default' | 'fill' | 'auto';
      margin?: string;
    } = {}
  ): LarkInput {
    const input: LarkInput = {
      tag: 'input',
      placeholder: { tag: 'plain_text', content: placeholder },
      default_value: options.default_value || '',
      width: options.width || 'default',
      name,
      margin: options.margin || '0px 0px 0px 0px',
      element_id: elementId,
    };

    if (options.label) {
      input.label = { tag: 'plain_text', content: options.label };
      input.label_position = options.label_position || 'left';
    }

    return input;
  }

  /**
   * 添加选择器
   */
  addSelect(
    name: string,
    elementId: string,
    placeholder: string,
    options: Array<{ text: string; value: string; icon?: string }>,
    config: {
      required?: boolean;
      width?: 'default' | 'fill' | 'auto';
      margin?: string;
    } = {}
  ): LarkSelect {
    return {
      tag: 'select_static',
      placeholder: { tag: 'plain_text', content: placeholder },
      options: options.map(opt => ({
        text: { tag: 'plain_text', content: opt.text },
        value: opt.value,
        ...(opt.icon && { icon: { tag: 'standard_icon', token: opt.icon } }),
      })),
      type: 'default',
      width: config.width || 'default',
      required: config.required || false,
      name,
      margin: config.margin || '0px 0px 0px 0px',
      element_id: elementId,
    };
  }

  /**
   * 设置配置
   */
  setConfig(config: Partial<LarkCardConfig>) {
    this.card.data.config = { ...this.card.data.config, ...config };
    return this;
  }

  /**
   * 构建最终卡片
   */
  build(): { card: LarkCard } {
    return { card: this.card };
  }
}

// Card configuration functions are now located in ./cards/ directory
