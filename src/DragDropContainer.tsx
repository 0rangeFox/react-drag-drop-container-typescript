import React, {
  Component,
  createRef,
  CSSProperties,
  ReactNode,
  RefObject,
} from 'react';
import { DropData } from './DropTarget';
import Event from './utils/Event';

interface DragData<T = any> {
  targetKey: string;
  dragData: T;
  dragElem: HTMLDivElement;
  containerElem: HTMLDivElement;
  sourceElem: HTMLSpanElement;
}

type HitDragData<T = any> = DragData<T> & {
  x: number;
  y: number;
};

enum DisplayMode {
  DISAPPEARED,
  HIDDEN,
  NORMAL,
}

const usesLeftButton = (e: MouseEvent): boolean =>
  (e.button || e.buttons) === 1;

interface DragDropContainerProps<TDrag, TDrop> {
  children: ReactNode;

  // Determines what you can drop on
  targetKey: string | string[];

  // If provided, we'll drag this instead of the actual object. Takes priority over dragClone if both are set
  customDragElement: ReactNode;

  // Makes the dragged element completely disappear while dragging so that it takes up no space
  disappearDraggedElement: boolean;

  // If true, then we will drag a clone of the object instead of the object itself. See also customDragElement
  dragClone: boolean;

  // Ghost element will display with this opacity
  dragElemOpacity: number;

  // We will pass this data to the target when you drag or drop over it
  dragData: TDrag;

  // If included, we'll only let you drag by grabbing elements with this className
  dragHandleClassName: string;

  // If true, then dragging is turned off
  noDragging: boolean;

  // Callbacks (optional):
  onDragStart(data: TDrag): void;
  onDrag(
    data: TDrag,
    target: Element,
    x: number,
    y: number,
    forceUpdate: VoidFunction
  ): void;
  onDragEnd(data: TDrag, target: Element, x: number, y: number): void;
  onDrop(event: CustomEvent<DropData<TDrop, TDrag>>): void;

  // Enable a render prop
  render?(state: DragDropContainerState): ReactNode;

  // Constrain dragging to the x or y directions only
  xOnly: boolean;
  yOnly: boolean;

  // Defaults to 10 while dragging, but you can customize it
  zIndex: number;
}

interface DragDropContainerState {
  leftOffset: number;
  topOffset: number;
  left: number;
  top: number;
  clicked: boolean;
  isDragging: boolean;
}

class DragDropContainer<TDrag, TDrop> extends Component<
  DragDropContainerProps<TDrag, TDrop>,
  DragDropContainerState
> {
  static defaultProps: DragDropContainerProps<object, object> = {
    targetKey: 'ddc',
    children: null,
    customDragElement: null,
    disappearDraggedElement: false,
    dragClone: false,
    dragElemOpacity: 1,
    dragData: {},
    dragHandleClassName: '',
    onDragStart: () => {},
    onDrag: () => {},
    onDragEnd: () => {},
    onDrop: () => {},
    noDragging: false,
    render: undefined,
    xOnly: false,
    yOnly: false,
    zIndex: 10,
  };

  private containerElement: RefObject<HTMLDivElement> =
    createRef<HTMLDivElement>();
  // The DOM elem we're dragging, and the elements we're dragging over.
  private dragElement: RefObject<HTMLDivElement> = createRef<HTMLDivElement>();
  private sourceElement: RefObject<HTMLSpanElement> =
    createRef<HTMLDivElement>();
  private currentTarget?: Element;
  private previousTarget?: Element;
  private previousData?: TDrag;

  public state: DragDropContainerState = {
    leftOffset: 0,
    topOffset: 0,
    left: 0,
    top: 0,
    clicked: false,
    isDragging: false,
  };

  public componentDidMount(): void {
    this.containerElement.current!.addEventListener(
      'mousedown',
      this.handleMouseDown
    );
  }

  public componentWillUnmount(): void {
    this.removeListeners();
  }

  private removeListeners = (): void => {
    const { targetKey } = this.props;

    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    Event.RemoveListener(
      document.documentElement,
      targetKey,
      'Dropped',
      this.handleDrop
    );
  };

  private generateDragData = (): DragData<TDrag> => ({
    targetKey: '',
    dragData: this.props.dragData,
    dragElem: this.dragElement.current!,
    containerElem: this.containerElement.current!,
    sourceElem: this.sourceElement.current!,
  });

  // Drop the z-index to get this elem out of the way, figure out what we're dragging over, then reset z-index
  private setCurrentTarget = (x: number, y: number): void => {
    this.dragElement.current!.style.zIndex = String(-1);
    const target = document.elementFromPoint(x, y) || document.body;
    this.dragElement.current!.style.zIndex = String(this.props.zIndex);
    // Prevent it from selecting itself as the target
    this.currentTarget = this.dragElement.current!.contains(target)
      ? document.body
      : target;
  };

  // Generate events as we enter and leave elements while dragging
  private generateEnterLeaveEvents = (x: number, y: number): void => {
    const { dragData, targetKey } = this.props;

    this.setCurrentTarget(x, y);

    if (
      this.currentTarget !== this.previousTarget ||
      dragData !== this.previousData
    ) {
      if (this.previousTarget)
        Event.Dispatch<DragData<TDrag>>(
          this.previousTarget,
          targetKey,
          'DragLeave',
          this.generateDragData()
        );

      if (this.currentTarget)
        Event.Dispatch<DragData<TDrag>>(
          this.currentTarget,
          targetKey,
          'DragEnter',
          this.generateDragData()
        );
    }

    this.previousData = dragData;
    this.previousTarget = this.currentTarget;
  };

  private generateDropEvent = (x: number, y: number): void => {
    const { targetKey } = this.props;

    // Generate a drop event in whatever we're currently dragging over
    this.setCurrentTarget(x, y);

    Event.Dispatch<HitDragData<TDrag>>(this.currentTarget!, targetKey, 'Drop', {
      ...this.generateDragData(),
      x,
      y,
    });

    // To prevent multiplying events on drop
    Event.RemoveListener(
      document.documentElement,
      targetKey,
      'Dropped',
      this.handleDrop
    );
  };

  private handleMouseDown = (e: MouseEvent): void => {
    if (usesLeftButton(e) && !this.props.noDragging) {
      document.addEventListener('mousemove', this.handleMouseMove);
      document.addEventListener('mouseup', this.handleMouseUp);
      this.startDrag(e.clientX, e.clientY);
    }
  };

  private startDrag = (clickX: number, clickY: number): void => {
    const { targetKey, onDragStart, dragData } = this.props;

    Event.AddListener(
      document.documentElement,
      targetKey,
      'Dropped',
      this.handleDrop
    );

    this.setState(
      {
        clicked: true,
        leftOffset: 5,
        topOffset: 15,
        left: clickX,
        top: clickY,
      },
      () => onDragStart(dragData)
    );
  };

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.props.noDragging && this.state.clicked) {
      e.preventDefault();
      this.drag(e.clientX, e.clientY);
    }
  };

  private static getOffscreenCoordinates = (
    x: number,
    y: number
  ): [number, number] | undefined => {
    // are we offscreen (or very close, anyway)? if so by how much?
    const leftEdge: number = 10;
    const rightEdge: number = window.innerWidth - 10;
    const topEdge: number = 10;
    const bottomEdge: number = window.innerHeight - 10;
    const xOff: number =
      x < leftEdge ? x - leftEdge : x > rightEdge ? x - rightEdge : 0;
    const yOff: number =
      y < topEdge ? y - topEdge : y > bottomEdge ? y - bottomEdge : 0;
    return yOff || xOff ? [xOff, yOff] : undefined;
  };

  private drag = (x: number, y: number): void => {
    const { xOnly, yOnly, dragData, onDrag } = this.props;

    this.generateEnterLeaveEvents(x, y);

    const stateChanges: any = { isDragging: true };
    const offScreen: boolean = !!DragDropContainer.getOffscreenCoordinates(
      x,
      y
    );

    if (!offScreen) {
      if (!yOnly) stateChanges.left = this.state.leftOffset + x;
      if (!xOnly) stateChanges.top = this.state.topOffset + y;
    }

    this.setState(stateChanges, () =>
      onDrag(dragData, this.currentTarget!, x, y, () => this.drag(x, y))
    );
  };

  private handleMouseUp = (e: MouseEvent): void =>
    this.setState(
      { clicked: false },
      () => this.state.isDragging && this.drop(e.clientX, e.clientY)
    );

  private handleDrop = (e: Event): void =>
    this.props.onDrop(e as CustomEvent<DropData<TDrop, TDrag>>);

  private drop = (x: number, y: number): void => {
    const { dragData, onDragEnd } = this.props;

    this.generateDropEvent(x, y);

    this.removeListeners();

    this.setState({ isDragging: false }, () =>
      onDragEnd(dragData, this.currentTarget!, x, y)
    );
  };

  private getDisplayMode = (): DisplayMode => {
    const { dragClone, customDragElement, disappearDraggedElement } =
      this.props;
    const { isDragging } = this.state;

    if (isDragging && !dragClone && !customDragElement)
      return disappearDraggedElement
        ? DisplayMode.DISAPPEARED
        : DisplayMode.HIDDEN;
    return DisplayMode.NORMAL;
  };

  public render(): JSX.Element {
    const {
      render: propsRender,
      children,
      dragElemOpacity,
      customDragElement,
      zIndex,
    } = this.props;
    const { top, left, isDragging } = this.state;

    const content: ReactNode = propsRender ? propsRender(this.state) : children;
    const ghostContent: ReactNode = customDragElement || content;
    const displayMode: DisplayMode = this.getDisplayMode();

    const containerStyles: CSSProperties = {
      position:
        displayMode === DisplayMode.DISAPPEARED ? 'absolute' : 'relative',
    };
    const sourceElemStyles: CSSProperties = {
      display: displayMode === DisplayMode.DISAPPEARED ? 'none' : 'inherit',
      visibility: displayMode === DisplayMode.HIDDEN ? 'hidden' : 'inherit',
    };
    const ghostStyles: CSSProperties = {
      top,
      left,
      zIndex,
      position: 'fixed',
      opacity: dragElemOpacity,
      display: isDragging ? 'block' : 'none',
    };

    return (
      <div
        className="ddcontainer"
        style={containerStyles}
        ref={this.containerElement}
      >
        <span
          className="ddcontainersource"
          style={sourceElemStyles}
          ref={this.sourceElement}
        >
          {content}
        </span>
        <div
          className="ddcontainerghost"
          style={ghostStyles}
          ref={this.dragElement}
        >
          {ghostContent}
        </div>
      </div>
    );
  }
}

export type { DragData, HitDragData };
export default DragDropContainer;
