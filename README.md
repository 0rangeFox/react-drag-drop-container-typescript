<h1 align="center"><img src="https://cdn.iconscout.com/icon/free/png-32/typescript-1174965.png" /> DragDropContainer and DropTarget</h1>

> A ReactJS library with Drag and Drop functionality for mouse and touch devices.

## 🔖 Description
The following library allows us to create Drag & Drop interactions more effectively and natively without using HTML5. This library was not made by me, but by [Peter Hollingsworth](https://github.com/peterh32), this is just maintenance and improvements of the [old library](https://github.com/peterh32/react-drag-drop-container).

## Code example
```typescript jsx
import { DragDropContainer, DropTarget } from 'react-drag-drop-container-typescript';

<DragDropContainer targetKey="foo" >
    <div>Drag Me!</div>
</DragDropContainer>

<DropTarget targetKey="foo" >
    <p>I'm a valid drop target for the object above since we both have the same targetKey!</p>
</DropTarget>
```

## 🤝 Contributing
This project will always remain open source and any kind of contribution is welcome. By participating in this project, you agree to keep common sense and contribute in a positive way.

## 📰 Credits
A special thanks to [Peter Hollingsworth](https://github.com/peterh32) who had the idea to start this project and to their contributors who also invested the time in making the improvements and bugfixes and another special thanks to [Victoria Likhuta](https://github.com/VictoriaTheBrave) who made an amazing clean code and performance improvements, just took her code from PRs ([#40](https://github.com/peterh32/react-drag-drop-container/pull/40) / [#43](https://github.com/peterh32/react-drag-drop-container/pull/43))

## 📝 License
Copyright © 2022 [João Fernandes](https://github.com/0rangeFox). <br/>
This project is [MIT](https://github.com/0rangeFox/react-drag-drop-container-typescript/blob/master/LICENSE) licensed.
