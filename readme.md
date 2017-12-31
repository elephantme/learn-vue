## Sead Api

```json
{
  "id": "elementId",
  "scope": {

  }
}
```

## 实例属性

| 属性    | 说明               | 类型     |
| ----- | ---------------- | ------ |
| scope | 存放options中的scope | Object |
| el    | options中id对应的容器  | Elemen |

## 私有属性

| 属性       | 说明                                       | 类型     |
| -------- | ---------------------------------------- | ------ |
| bindings | 存放指令，key为scope中的属性名，value为{value: '', directives: []} | Object |
|          |                                          |        |
|          |                                          |        |



## 核心

实例化Sead主要做的事情

1. 查找容器中配置了directive的元素列表。
2. 依次去解析每个元素上的directive（parseDirective）
  1. 属性命名规则：标志名称-指令名称-指令参数-参数-...
  2. 属性值命名规则：scope名称 | 过滤器名称 | 过滤器名称
3. 根据element上directive属性定义，解析出directive对象结构如下

| 属性         | 说明                                       | 类型       |
| ---------- | ---------------------------------------- | -------- |
| attr       | 原始属性                                     | String   |
| key        | 对应scope对象中的属性名称                          | String   |
| filters    | 过滤器名称列表                                  | Array    |
| definition | 该指令的定义，即directives中的那些函数                 | Function |
| argument   | 从attr中解析出来的参数（只支持一个参数）                   | String   |
| update     | 更新directive时调用`typeof def === 'function' ? def : def.update` | Function |
| bind       | 如果directive中定义了bind方法，则在`bindDirective`中会调用 | Function |
| el         | 存储当前element元素                            | Element  |

4. `bindDirective` 作用域和directive建立联系，通过defineProperty使scope赋值时，会触发directive的update方法。
