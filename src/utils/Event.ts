class Event {
  private static Generate = <T>(event: string, data: T): CustomEvent<T> =>
    new CustomEvent<T>(event, {
      bubbles: true,
      cancelable: true,
      detail: data,
    });

  public static AddListener(
    element: Element,
    keys: string | string[],
    event: string,
    func: EventListener
  ) {
    (Array.isArray(keys) ? keys : [keys as string]).forEach((key) =>
      element.addEventListener(`${key}${event}`, func)
    );
  }

  public static RemoveListener(
    element: Element,
    keys: string | string[],
    event: string,
    func: EventListener
  ) {
    (Array.isArray(keys) ? keys : [keys as string]).forEach((key) =>
      element.removeEventListener(`${key}${event}`, func)
    );
  }

  public static Dispatch<T>(
    element: Element,
    keys: string | string[],
    event: string,
    data: T
  ) {
    (Array.isArray(keys) ? keys : [keys as string]).forEach((key) =>
      element.dispatchEvent(
        this.Generate<T>(`${key}${event}`, { ...data, targetKey: key })
      )
    );
  }
}

export default Event;
