import React, { Component, ReactNode } from 'react';
import { DragData } from './DragDropContainer';

export type DropData = {
  dropData: object;
  dragData: object;
  dropElem: HTMLSpanElement;
};

interface DropTargetProps {
  children: ReactNode;
  render?(): ReactNode;
  highlightClassName: string;

  // Needs to match the targetKey in the DragDropContainer -- matched via the enter/leave/drop event names, above
  targetKey: string;

  // Data that gets sent back to the DragDropContainer and shows up in its onDrop() callback event
  dropData: object;

  // Callbacks
  onDragEnter(event: CustomEvent<DragData>): void;
  onDragLeave(event: CustomEvent<DragData>): void;
  onHit(event: CustomEvent<DragData>): void;
}

interface DropTargetState {
  highlighted: boolean;
}

class DropTarget extends Component<DropTargetProps, DropTargetState> {
  static defaultProps: DropTargetProps = {
    children: null,
    targetKey: 'ddc',
    onDragEnter: () => {},
    onDragLeave: () => {},
    onHit: () => () => {},
    dropData: {},
    highlightClassName: 'highlighted',
    render: undefined,
  };

  private targetElement?: HTMLSpanElement = undefined;

  private constructor(props: DropTargetProps) {
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

  private static createEvent = (
    eventName: string,
    eventData: DropData
  ): CustomEvent<DropData> =>
    new CustomEvent<DropData>(eventName, {
      bubbles: true,
      cancelable: true,
      detail: eventData,
    });

  // Tell the drop source about the drop, then do the callback
  private handleDrop = (e: Event): void => {
    const { targetKey, dropData, onHit } = this.props;
    const event: CustomEvent<DragData> = e as CustomEvent<DragData>;

    const evt: CustomEvent<DropData> = DropTarget.createEvent(
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
    const event: CustomEvent<DragData> = e as CustomEvent<DragData>;

    highlightClassName && this.setState({ highlighted: true });

    onDragEnter(event);
  };

  private handleDragLeave = (e: Event): void => {
    const { highlightClassName, onDragLeave } = this.props;
    const event: CustomEvent<DragData> = e as CustomEvent<DragData>;

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
