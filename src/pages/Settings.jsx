import { signOutLocally } from '@/lib/session';
import { clearLocalGrants } from '@/lib/devCoins';
import { base44 } from '@/api/base44Client';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Coins, KeyRound, Loader2, LogOut, Palette, Trash2, User } from 'lucide-react';
import ThemePicker from '@/components/settings/ThemePicker';
import RecentlyDeleted from '@/components/settings/RecentlyDeleted';
import { applyAccent, writeCustom } from '@/lib/accents';
import { useWallet } from '@/lib/useWallet';
import { toast } from '@/components/ui/use-toast';

const ENTITIES = ['Block', 'StudyRoom', 'StudySession', 'MediaItem', 'StickyList', 'Purchase', 'CoinGrant'];

export default function Settings() {
  const [me, setMe] = useState(null);
  const [username, setUsername] = useState('');
  const [nameState, setNameState] = useState({ status: 'idle', message: '' });
  const [accent, setAccent] = useState('coral');
  const [password, setPassword] = useState('');
  const [dangerBusy, setDangerBusy] = useState('');
  const wallet = useWallet();

  useEffect(() => {
    base44.auth.me().then(async (user) => {
      setMe(user);
      setUsername(user?.username || '');
      setAccent(user?.accent || localStorage.getItem('nook.accent') || 'coral');
      try {
        const page = await base44.entities.Username.filter({ user_id: user.id }, { limit: 1 });
        const record = (page.items || [])[0];
        if (record) setUsername(record.username);
      } catch (err) {
        /* fall back to whatever the profile says */
      }
    });
  }, []);

  const checkName = async (value) => {
    if (!value) return;
    setNameState({ status: 'checking', message: '' });
    try {
      const res = await base44.functions.invoke('username', { action: 'check', username: value });
      setNameState(
        res.data?.available
          ? { status: 'ok', message: 'free' }
          : { status: 'taken', message: 'taken' }
      );
    } catch (err) {
      setNameState({ status: 'idle', message: '3–20 letters, numbers, dots, dashes' });
    }
  };

  const saveName = async () => {
    try {
      const res = await base44.functions.invoke('username', { action: 'set', username });
      if (res.data?.error) {
        setNameState({ status: 'taken', message: res.data.error });
        return;
      }
      setNameState({ status: 'ok', message: 'saved' });
      setMe((prev) => ({ ...prev, username: res.data.username }));
      try {
        await base44.auth.updateMe({ username: res.data.username });
      } catch (err) {
        /* the name is stored either way */
      }
      toast({ title: 'saved', description: `you are @${res.data.username}` });
    } catch (err) {
      setNameState({ status: 'taken', message: 'could not save' });
    }
  };

  const chooseAccent = async (id) => {
    setAccent(id);
    applyAccent(id);
    try {
      await base44.auth.updateMe({ accent: id });
    } catch (err) {
      /* kept on this device anyway */
    }
  };

  const chooseCustom = async (shade) => {
    writeCustom(shade);
    await chooseAccent('custom');
  };

  const sendReset = async () => {
    try {
      await base44.auth.resetPasswordRequest(me.email);
      toast({ title: 'check your email', description: 'reset link sent.' });
    } catch (err) {
      toast({ title: 'check your email', description: 'if that address exists, a link is on its way.' });
    }
  };

  const confirmPassword = async () => {
    await base44.auth.loginViaEmailPassword(me.email, password);
  };

  const wipeData = async () => {
    setDangerBusy('wipe');
    try {
      await confirmPassword();
      for (const entity of ENTITIES) {
        try {
          await base44.entities[entity].deleteMany({});
        } catch (err) {
          /* keep going */
        }
      }
      clearLocalGrants();
      setPassword('');
      toast({ title: 'Everything is cleared', description: 'Your rooms, blocks, sessions and orders are gone.' });
      wallet.reload();
    } catch (err) {
      toast({ title: 'Wrong password', description: 'Nothing was deleted.' });
    } finally {
      setDangerBusy('');
    }
  };

  const deleteAccount = async () => {
    setDangerBusy('delete');
    try {
      await confirmPassword();
      for (const entity of ENTITIES) {
        try {
          await base44.entities[entity].deleteMany({});
        } catch (err) {
          /* keep going */
        }
      }
      signOutLocally('/login');
    } catch (err) {
      toast({ title: 'Wrong password', description: 'Nothing was deleted.' });
      setDangerBusy('');
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="font-heading text-2xl">settings</h1>
        <p className="text-[12px] text-muted-foreground">your account and data.</p>
      </div>

      <section className="surface p-5">
        <h2 className="mb-3 flex items-center gap-2 font-heading text-sm font-extrabold">
          <User className="h-4 w-4" /> you
        </h2>
        <div className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-[12px] text-muted-foreground">username</span>
            <div className="flex gap-2">
              <Input
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.toLowerCase());
                  setNameState({ status: 'idle', message: '' });
                }}
                onBlur={(e) => checkName(e.target.value.toLowerCase())}
                className="h-11"
                placeholder="your-name"
              />
              <Button className="h-11 rounded-full px-5" onClick={saveName}>
                save
              </Button>
            </div>
            {nameState.message && (
              <span
                className={
                  nameState.status === 'taken'
                    ? 'text-[11px] font-bold text-destructive'
                    : 'text-[11px] font-bold text-muted-foreground'
                }
              >
                {nameState.message}
              </span>
            )}
          </label>

          <p className="text-[12px] text-muted-foreground">{me?.email}</p>
        </div>
      </section>

      <section className="surface p-5">
        <h2 className="mb-3 flex items-center gap-2 font-heading text-sm font-extrabold">
          <Palette className="h-4 w-4" /> accent
        </h2>
        <ThemePicker value={accent} onChange={chooseAccent} onCustom={chooseCustom} />
      </section>

      <section className="surface p-5">
        <h2 className="mb-3 flex items-center gap-2 font-heading text-sm font-extrabold">
          <Coins className="h-4 w-4" /> coins
        </h2>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] font-bold text-muted-foreground">
          <span className="font-heading text-3xl font-black text-foreground">
            {wallet.balance ?? wallet.earned - wallet.spent}
          </span>
          <span>{wallet.earned} earned · {wallet.minutes} min</span>
          <span>{wallet.spent} spent</span>
          <span>{wallet.sessions} sessions</span>
        </div>
      </section>

      <section className="surface p-5">
        <h2 className="mb-3 flex items-center gap-2 font-heading text-sm font-extrabold">
          <KeyRound className="h-4 w-4" /> sign-in
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-11 rounded-full" onClick={sendReset}>
            send reset email
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-full"
            onClick={() => signOutLocally('/login')}
          >
            <LogOut className="mr-2 h-4 w-4" /> log out
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">sign-in also needs a six-digit code we email you.</p>
      </section>

      <section className="surface p-5">
        <h2 className="mb-3 font-heading text-sm">deleted</h2>
        <RecentlyDeleted />
      </section>

      <section className="surface border border-destructive/20 p-5">
        <h2 className="mb-3 flex items-center gap-2 font-heading text-sm font-extrabold text-destructive">
          <Trash2 className="h-4 w-4" /> account
        </h2>
        <div className="space-y-3">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="your password"
            className="h-11"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="h-11 rounded-full"
              disabled={!password || !!dangerBusy}
              onClick={() => {
                if (window.confirm('reset all your data? rooms, blocks, sessions, boards and orders go.')) wipeData();
              }}
            >
              {dangerBusy === 'wipe' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              reset all data
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-full text-destructive"
              disabled={!password || !!dangerBusy}
              onClick={() => {
                if (
                  window.confirm(
                    'delete your data and sign out? your login stays registered.'
                  )
                )
                  deleteAccount();
              }}
            >
              {dangerBusy === 'delete' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              delete account
            </Button>
          </div>
        </div>
      </section>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <Check className="h-3 w-3" /> if offline, changes will sync later.
      </p>
    </div>
  );
}