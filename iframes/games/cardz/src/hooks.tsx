// eslint-disable-next-line
import { useEffect } from 'react';
import {
  Table,
  TableEvent,
  tableSubscribeEvent,
  tableUnsubscribeEvent,
} from './table';

export function useSubscription<T>(
  table: Table<T>,
  ev: TableEvent | T,
  cb: () => void
) {
  useEffect(() => {
    tableSubscribeEvent(table, ev, cb);
    return () => {
      tableUnsubscribeEvent(table, ev, cb);
    };
  }, [table, ev, cb]);
}
