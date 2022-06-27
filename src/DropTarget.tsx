import React, {
  FunctionComponent,
  PropsWithChildren,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { DragData, HitDragData } from './DragDropContainer';
import Event from './utils/Event';

interface DropData<TDrop = any, TDrag = any> {
  targetKey: string;
  dropData: TDrop;
  dragData: TDrag;
  dropElem: HTMLSpanElement;
}

type DropTargetProps<TDrop, TDrag> = {
  highlightClassName?: string;

  // Needs to match the targetKey in the DragDropContainer -- matched via the enter/leave/drop event names, above
  targetKey?: string | string[];

  // Data that gets sent back to the DragDropContainer and shows up in its onDrop() callback event
  dropData?: TDrop;

  // Callbacks
  onDragEnter?(event: CustomEvent<DragData<TDrag>>): void;
  onDragLeave?(event: CustomEvent<DragData<TDrag>>): void;
  onHit?(event: CustomEvent<HitDragData<TDrag>>): void;
};

const DropTarget: FunctionComponent<
  PropsWithChildren<DropTargetProps<any, any>>
> = <TDrop, TDrag>({
  highlightClassName = 'highlighted',
  targetKey = 'ddc',
  dropData = {} as TDrop,
  onDragEnter,
  onDragLeave,
  onHit,
  children,
}: PropsWithChildren<DropTargetProps<TDrop, TDrag>>) => {
  const [isHighlighted, setHighlighted] = useState<boolean>(false);
  const targetElement = useRef<HTMLSpanElement>(null);

  const handleDragEnter = useCallback(
    (e: Event): void => {
      const event: CustomEvent<DragData<TDrag>> = e as CustomEvent<
        DragData<TDrag>
      >;

      highlightClassName && setHighlighted(true);
      onDragEnter && onDragEnter(event);
    },
    [highlightClassName, onDragEnter]
  );

  const handleDragLeave = useCallback(
    (e: Event): void => {
      const event: CustomEvent<DragData<TDrag>> = e as CustomEvent<
        DragData<TDrag>
      >;

      highlightClassName && setHighlighted(false);
      onDragLeave && onDragLeave(event);
    },
    [highlightClassName, onDragLeave]
  );

  // Tell the drop source about the drop, then do the callback
  const handleDrop = useCallback(
    (e: Event): void => {
      const event: CustomEvent<HitDragData<TDrag>> = e as CustomEvent<
        HitDragData<TDrag>
      >;

      Event.Dispatch<DropData<TDrop, TDrag>>(
        event.detail.containerElem,
        targetKey,
        'Dropped',
        {
          targetKey: '',
          dropData,
          dragData: event.detail.dragData,
          dropElem: targetElement.current!,
        }
      );

      onHit && onHit(event);
      setHighlighted(false);
    },
    [targetKey, dropData, onHit]
  );

  useLayoutEffect(() => {
    const currentTargetElement: HTMLSpanElement = targetElement.current!;

    Event.AddListener(
      currentTargetElement,
      targetKey,
      'DragEnter',
      handleDragEnter
    );
    Event.AddListener(
      currentTargetElement,
      targetKey,
      'DragLeave',
      handleDragLeave
    );
    Event.AddListener(currentTargetElement, targetKey, 'Drop', handleDrop);

    return () => {
      Event.RemoveListener(
        currentTargetElement,
        targetKey,
        'DragEnter',
        handleDragEnter
      );
      Event.RemoveListener(
        currentTargetElement,
        targetKey,
        'DragLeave',
        handleDragLeave
      );
      Event.RemoveListener(currentTargetElement, targetKey, 'Drop', handleDrop);
    };
  }, [targetElement, targetKey, handleDragEnter, handleDragLeave, handleDrop]);

  const targetElemClassNames = `droptarget ${
    isHighlighted ? highlightClassName : ''
  }`;

  return (
    <span
      ref={targetElement}
      className={targetElemClassNames}
      children={children}
    />
  );
};

export type { DropData };
export default DropTarget;
