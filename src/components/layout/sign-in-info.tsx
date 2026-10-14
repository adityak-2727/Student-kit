"use client";

import { useRef, useState } from "react";
import { Button } from "../ui/button";
import { DialogFrame } from "../ui/dialog-frame";

export function SignInInfo() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return <>
    <Button ref={trigger} variant="secondary" onClick={() => setOpen(true)}>About sign-in availability</Button>
    <DialogFrame open={open} onOpenChange={setOpen} returnFocus={trigger} title="Sign-in is not available yet" description="This build is a visual preview. It does not create an account.">
      <div className="dialog-body"><p>Google authentication and encrypted account storage are implemented. This environment has not been configured for account access.</p><p>Setup needs a Google Web OAuth client, a restricted MongoDB Atlas environment and protected encryption keys. Instructions are in the repository’s setup runbook.</p><p>Keep credentials in your local environment or secret manager. Never paste them into chat.</p><Button onClick={() => setOpen(false)}>Got it</Button></div>
    </DialogFrame>
  </>;
}
