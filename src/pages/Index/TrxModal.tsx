import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import { useStore } from 'store';
import RumSdk from 'rum-sdk-browser';

interface IProps {
  groupId: string
  trxId: string
  open: boolean
  onClose: () => void
}

const Trx = observer((props: IProps) => {
  const { snackbarStore } = useStore();
  const state = useLocalObservable(() => ({
    checking: false,
    trx: {} as any,
  }));

  React.useEffect(() => {
    (async () => {
      try {
        const trx = await RumSdk.chain.Trx.get(props.groupId, props.trxId);
        console.log({ trx });
        state.trx = trx;
      } catch (err) {
        console.log(err);
        snackbarStore.show({
          message: (err as any).message,
          type: 'error'
        })
      }
    })();
  }, []);

  return (
    <div className="p-8">
      <div className="border border-gray-af bg-gray-f2 p-4 text-12 text-gray-700 tracking-wide text-left w-[500px] h-[190px] overflow-auto">
        <pre dangerouslySetInnerHTML={{ __html: JSON.stringify(state.trx, null, 2) }} />
      </div>
    </div>
  )
})


export default observer((props: IProps) => (
  <Dialog
    open={props.open}
    onClose={() => props.onClose()}
    hideCloseButton
    transitionDuration={{
      enter: 300,
    }}
  >
    <Trx {...props} />
  </Dialog>
));
