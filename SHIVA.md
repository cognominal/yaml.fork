# lyaml : an extension to yaml

I want to design lyaml, a yaml extension that provides a  serialisation more concise
than regular yaml for objects that have the shiva nature.

A shiva object can have a name and can comport a collection that can be either/both a mapping
and a sequence.
Lyaml serializes the mapping and the sequence in succession instead of requiring to use an intermediate mapping.

Classes derived from the  adapter class `ShivaAdapter`  will be used.

```ts
interface ShivaAdapter {
    name(): string
    map():  ??? # type TBD
    seq(): string[]
}
```

## Role of opencode

Clarify and complete the specification of lyaml.
Implement it.
How to add it to  the regular yaml API ?

## Motivating example : serialization of DOM. DOM here represented as html

An element node being both a mapping and a sequence, an intermediated
mapping with
keys `attributes` and `children` is necessary when serializing using regular yaml.

### html code

```html
<h1 id="id" class="a b">some <b>bold</b>text</h1>
even more text
```

### regular yaml serialization

```yaml
- h1:
  attributes:
    id: id
    class: a b
  children:
    - some 
    - b:
      - bold
    - text
- | 

   even more text


### lyaml serialization
```

To avoid explicit `attributes` and `children` keys, lyaml will use a collection
that is a mapping followed by a sequence.  

```lyaml
- h1: # node name, that's the tag for html
    id: id
    class: a b
    - some 
    - b:
      - bold
    - text
    - |

       even more text

```

### Note : Need to deal with all the DOM types

-Element Node.ELEMENT_NODE The HTML tags themselves (e.g., `<body>`, `<a>`, `<h1>``).
-Text Node.TEXT_NODE The actual text inside or between elements, including
 whitespace and line breaks.
-Comment Node.COMMENT_NODE Anything wrapped in ``.
-Document Node.DOCUMENT_NODE The "root" of the entire tree
 (the`window.document` object).
-DocumentType `Node.DOCUMENT_TYPE_NODE` The `<!DOCTYPE html>` declaration
 at the top of the file.

## Note

Need to specify the flow style for yaml.
