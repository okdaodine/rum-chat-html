import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Welcome from './Welcome';
import { TextField, Tooltip } from '@material-ui/core';
import { HiOutlineMenu, HiX } from 'react-icons/hi';
import Button from 'components/Button';
import { IGroup, utils } from 'rum-sdk-browser';
import { useStore } from 'store';
import sleep from 'utils/sleep';
import { RiCheckDoubleFill, RiCheckLine } from 'react-icons/ri';
import classNames from 'classnames';
import KeystoreModal from './KeystoreModal';
import TrxModal from './TrxModal';
import multiavatar from '@multiavatar/multiavatar'
import store from 'store2';
import { v4 as uuidv4 } from 'uuid';
import Query from 'utils/query';
import RumSdk, { IObject, IActivity } from 'rum-sdk-browser';
import { runInAction } from 'mobx';
import Loading from 'components/Loading';

export default observer(() => {
  const { snackbarStore, confirmDialogStore } = useStore();
  const state = useLocalObservable(() => ({
    started: !!store('privateKey'),
    inputValue: '',
    ids: [] as string[],
    map: {} as Record<string, IObject>,
    postAddressMap: {} as Record<string, string>,
    postTrxMap: {} as Record<string, string>,
    showMenu: false,
    privateKey: '',
    address: '',
    configReady: false,
    keyReady: false,
    postReady: false,
    openKeystoreModal: false,
    switchingAccount: false,
    openTrxModal: false,
    trxId: '',
    sending: false,
    pending: true,
    group: {} as IGroup,
    get isReady() {
      return state.keyReady && state.postReady && state.configReady
    }
  }));
  const listContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const seedUrl = Query.get('seedUrl') || (window as any).seedUrl;
        store('seedUrl', seedUrl);
        RumSdk.cache.Group.clear();
        RumSdk.cache.Group.add(store('seedUrl'));
        state.group = utils.seedUrlToGroup(seedUrl);
        state.configReady = true;
      } catch (_) {}
    })();
  }, [])

  React.useEffect(() => {
    (async () => {
      if (state.isReady) {
        await sleep(200);
        state.pending = false;
      }
    })();
  }, [state.isReady])

  React.useEffect(() => {
    if (!state.started || !state.group) {
      return;
    }
    (async () => {
      state.privateKey = store('privateKey') as string;
      state.address = store('address') as string;
      state.keyReady = true;
    })();

  }, [state.started]);

  React.useEffect(() => {
    if (!state.started || !state.group) {
      return;
    }

    list();
    setInterval(list, 1000);
  }, [state.started]);


  const goToBottom = () => {
    if (listContainerRef.current && listContainerRef.current?.lastChild) {
      (listContainerRef.current?.lastChild as any).scrollIntoView()
    }
  }

  function isVisible(element: any) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
  
    return (
      rect.bottom >= 0 &&
      rect.right >= 0 &&
      rect.top <= windowHeight &&
      rect.left <= windowWidth
    );
  }

  const list = async () => {
    try {
      const contents = await RumSdk.chain.Content.list({
        groupId: state.group.groupId,
        ...(state.postReady ? { reverse: true, count: 5 } : { count: 999 })
      });
      for (const content of contents) {
        if (content) {
          const post = (content.Data as IActivity).object!;
          const postId = post.id!;
          if (!state.map[postId]) {
            state.ids.push(postId);
          }
          state.map[postId] = post;
          state.postAddressMap[postId] = RumSdk.utils.pubkeyToAddress(content.SenderPubkey);
          state.postTrxMap[postId] = content.TrxId;
        }
      }
      if (!state.postReady) {
        await sleep(1);
        goToBottom();
        state.postReady = true;
      } else {
        if (listContainerRef.current && listContainerRef.current?.lastChild) {
          if (isVisible(listContainerRef.current?.lastChild as any)) {
            await sleep(1);
            goToBottom();
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  const send = async (value: string) => {
    if (state.sending) {
      return;
    }
    state.sending = true;
    try {
      const postId = uuidv4();
      const data = {
        type: 'Create',
        object: {
          type: 'Note',
          id: postId,
          content: value,
        },
        published: new Date().toISOString(),
      };
      const res = await RumSdk.chain.Trx.create({
        data,
        groupId: state.group.groupId,
        privateKey: store('privateKey'),
      });
      console.log({ res });
      runInAction(() => {
        state.postAddressMap[postId] = state.address;
        state.map[postId] = data.object;
        state.ids.push(postId);
      });
      setTimeout(goToBottom, 1);
    } catch (err) {
      console.log(err);
      snackbarStore.show({
        message: '发送失败',
        type: 'error'
      })
    }
    state.sending = false;
  }

  if (!state.started) {
    return (
      <Welcome start={() => {
        state.started = true;
      }} />
    )
  }


  return (
    <div className="box-border mt-5 w-[600px] mx-auto">
      <div className="bg-gray-f2 rounded-12">
        <div className="py-4 px-8 text-gray-88 text-18 border-b border-gray-d8" onClick={goToBottom}>
          {state.group!.groupName}
        </div>
        <div className="h-[76vh] overflow-auto px-8 pt-5 pb-2" ref={listContainerRef}>
          {state.ids.map((id) => {
            const post = state.map[id];
            const postAddress = state.postAddressMap[id];
            const fromMyself = postAddress === state.address;
            const isSyncing = !state.postTrxMap[id];
            return (
              <div className={classNames({
                'flex-row-reverse': fromMyself
              }, "mb-3 py-1 flex items-center w-full")} key={id}>
                <div className="w-[42px] h-[42px] bg-white rounded-full" dangerouslySetInnerHTML={{
                  __html: multiavatar(postAddress)
                }} />
                <Tooltip
                  placement={fromMyself ? 'left' : 'right'}
                  title="点击查看 Trx"
                  disableHoverListener={isSyncing}
                  arrow
                  onClick={() => {
                    if (isSyncing) {
                      return;
                    }
                    state.trxId = state.postTrxMap[id];
                    state.openTrxModal = true;
                  }}
                >
                  <div className={classNames({
                    'bg-[#95EC69]': fromMyself,
                    'bg-white': !fromMyself
                  }, "max-w-[360px] text-slate-800 px-3 py-[10px] rounded-5 text-16 mx-3 relative cursor-pointer")}>
                    {post.content}
                    {fromMyself && (
                      <div className={classNames({
                        "bottom-[4px] left-[-28px]": fromMyself,
                        "bottom-[4px] right-[-28px]": !fromMyself,
                      }, "text-18 absolute")}>
                        {isSyncing ? <RiCheckLine className="opacity-30" /> : (
                          <div>
                            <RiCheckDoubleFill className="text-[#39D101] cursor-pointer opacity-70" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Tooltip>
              </div>
            )
          })}
        </div>
      </div>
      <div className="mt-5 relative flex items-center">
        {state.sending && (
          <div className="absolute inset-0 bg-white bg-opacity-50 w-full flex items-center justify-center z-10">
            <Loading size={12} />
          </div>
        )}
        <div className="w-[42px] h-[42px] rounded-full mr-3" dangerouslySetInnerHTML={{
          __html: multiavatar(state.address)
        }} />
        <TextField
          placeholder='说点什么...'
          value={state.inputValue}
          onChange={(e) => { state.inputValue = e.target.value; }}
          variant="outlined"
          fullWidth
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && state.inputValue) {
              send(state.inputValue.trim());
              state.inputValue = '';
            }
          }}
        />
        <div className="absolute right-[-80px] top-0 text-20 text-gray-400 h-10 w-10 flex items-center justify-center border border-gray-400 rounded-full cursor-pointer" onClick={() => {
          state.showMenu = !state.showMenu;
        }}>
          {!state.showMenu && <HiOutlineMenu />}
          {state.showMenu && <HiX />}
        </div>
        {state.showMenu && (
          <div className="absolute right-[-170px] top-[-150px] text-20 text-gray-400 animate-fade-in">
            <Button color="gray" outline onClick={() => {
              state.switchingAccount = false;
              state.openKeystoreModal = true;
            }}>我的帐号信息</Button>
            <div />
            <Button color="gray" outline className="mt-4" onClick={() => {
              state.switchingAccount = true;
              state.openKeystoreModal = true;
            }}>使用其他账号</Button>
            <div />
            <Button color="gray" outline className="mt-4" onClick={() => {
              confirmDialogStore.show({
                content: '确定退出帐号吗？',
                ok: async () => {
                  confirmDialogStore.hide();
                  await sleep(400); 
                  store.clear();
                  window.location.reload();
                },
              });
            }}>退出</Button>
          </div>
        )}
        <KeystoreModal
          switchingAccount={state.switchingAccount}
          open={state.openKeystoreModal}
          onClose={() => {
          state.openKeystoreModal = false;
        }} />
        <TrxModal
          groupId={state.group!.groupId}
          trxId={state.trxId}
          open={state.openTrxModal}
          onClose={() => {
          state.openTrxModal = false;
        }} />
      </div>
      {state.pending && (
        <div className="fixed inset-0 bg-white flex items-center justify-center text-gray-88 text-18">
          <div className="-mt-20 tracking-wider">
            加载中...
          </div>
        </div>
      )}
    </div>
  )
});
