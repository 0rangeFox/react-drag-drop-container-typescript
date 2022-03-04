import React, { Component, ReactNode } from 'react';
import { DragData } from './DragDropContainer';

export type DropData<TDrop = any, TDrag = any> = {
  dropData: TDrop;
  dragData: TDrag;
  dropElem: HTMLSpanElement;
};

interface DropTargetProps<TDrop, TDrag> {
  children: ReactNode;
  render?(): ReactNode;
  highlightClassName: string;

  // Needs to match the targetKey in the DragDropContainer -- matched via the enter/leave/drop event names, above
  targetKey: string;

  // Data that gets sent back to the DragDropContainer and shows up in its onDrop() callback event
  dropData: TDrop;

  // Callbacks
  onDragEnter(event: CustomEvent<DragData<TDrag>>): void;
  onDragLeave(event: CustomEvent<DragData<TDrag>>): void;
  onHit(event: CustomEvent<DragData<TDrag>>): void;
}

interface DropTargetState {
  highlighted: boolean;
}

class DropTarget<TDrop, TDrag> extends Component<
  DropTargetProps<TDrop, TDrag>,
  DropTargetState
> {
  static defaultProps: DropTargetProps<object, object> = {
    children: null,
    targetKey: 'ddc',
    onDragEnter: () => {},
    onDragLeave: () => {},
    onHit: () => {},
    dropData: {},
    highlightClassName: 'highlighted',
    render: undefined,
  };

  private targetElement?: HTMLSpanElement = undefined;

  private constructor(props: DropTargetProps<TDrop, TDrag>) {
    super(props);
    this.setTargetElementRef = this.setTargetElementRef.bind(this);
  }

  public state: DropTargetState = {
    highlighted: false,
  };

  private setTargetElementRef(node: HTMLSpanElement): void {
    this.targetElement = node;
  }

  public componentDidMount(): void {
    const { targetKey } = this.props;

    this.targetElement!.addEventListener(
      `${targetKey}DragEnter`,
      this.handleDragEnter
    );
    this.targetElement!.addEventListener(
      `${targetKey}DragLeave`,
      this.handleDragLeave
    );
    this.targetElement!.addEventListener(`${targetKey}Drop`, this.handleDrop);
  }

  private static createEvent = <TDrop, TDrag>(
    eventName: string,
    eventData: DropData<TDrop, TDrag>
  ): CustomEvent<DropData<TDrop, TDrag>> =>
    new CustomEvent<DropData<TDrop, TDrag>>(eventName, {
      bubbles: true,
      cancelable: true,
      detail: eventData,
    });

  // Tell the drop source about the drop, then do the callback
  private handleDrop = (e: Event): void => {
    const { targetKey, dropData, onHit } = this.props;
    const event: CustomEvent<DragData<TDrag>> = e as CustomEvent<
      DragData<TDrag>
    >;

    const evt: CustomEvent<DropData<TDrop, TDrag>> = DropTarget.createEvent(
      `${targetKey}Dropped`,
      {
        dropData,
        dragData: event.detail.dragData,
        dropElem: this.targetElement!,
      }
    );

    event.detail.containerElem.dispatchEvent(evt);
    onHit(event);
    this.setState({ highlighted: false });
  };

  private handleDragEnter = (e: Event): void => {
    const { highlightClassName, onDragEnter } = this.props;
    const event: CustomEvent<DragData<TDrag>> = e as CustomEvent<
      DragData<TDrag>
    >;

    highlightClassName && this.setState({ highlighted: true });

    onDragEnter(event);
  };

  private handleDragLeave = (e: Event): void => {
    const { highlightClassName, onDragLeave } = this.props;
    const event: CustomEvent<DragData<TDrag>> = e as CustomEvent<
      DragData<TDrag>
    >;

    highlightClassName && this.setState({ highlighted: false });

    onDragLeave(event);
  };

  public render(): JSX.Element {
    const { render: propsRender, children, highlightClassName } = this.props;
    const { highlighted } = this.state;

    const content: ReactNode = propsRender ? propsRender() : children;
    const targetElemClassNames = `droptarget ${
      highlighted ? highlightClassName : ''
    }`;

    return (
      <span ref={this.setTargetElementRef} className={targetElemClassNames}>
        {content}
      </span>
    );
  }
}

export default DropTarget;
