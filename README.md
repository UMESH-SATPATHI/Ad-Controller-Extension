# Ad Volume Controller

A Chrome extension that automatically mutes YouTube ads and attempts to
activate the visible **Skip Ad** control when it becomes available.

> **Status:** The current implementation was reported to be working in
> local testing. Behavior may change if YouTube changes its player
> interface or ad controls.

## Features

-   Detects when a YouTube video player is showing an ad.
-   Mutes the video during the detected ad.
-   Looks for a visible Skip Ad button and attempts to activate it.
-   Restores the previous mute/volume state when the ad ends.

## How it works

The extension uses a content script to monitor the YouTube player and
detect ad/skip-button states. When a skip control is found, the content
script sends its screen coordinates to the background service worker.
The service worker uses the Chrome `debugger` API to dispatch mouse
input at those coordinates.

This design requires the `debugger` permission. Chrome may display a
prominent permission warning, and use of this API can be subject to
Chrome Web Store review. Store approval and compatibility with YouTube
are not guaranteed.

## Project files

A typical project layout is:

``` text
ad-volume-controller/
├── manifest.json
├── background.js
├── content.js
└── README.md
```

Keep any additional icons, images, or other assets referenced by
`manifest.json` in the locations specified there.

## Install locally for testing

1.  Download or clone this project.
2.  Open `chrome://extensions` in Chrome.
3.  Turn on **Developer mode**.
4.  Select **Load unpacked**.
5.  Choose the project directory containing `manifest.json`.
6.  Open YouTube and test the extension.

If you edit the extension files, return to `chrome://extensions` and
click the extension's **Reload** button before testing again.

## Permissions and access

The manifest should declare only the permissions and host access the
implementation actually requires. The current skip-click approach uses
the `debugger` permission and YouTube host access.

Review the permissions carefully before distributing the extension.
Explain the purpose of each permission in the store listing and provide
any privacy disclosures required by the Chrome Web Store.

## Limitations

-   YouTube may change its player markup, selectors, ad behavior, or
    skip controls, which can break detection.
-   Not every ad has a skippable control, and the extension cannot
    guarantee that an ad will be skipped.
-   Browser updates and Chrome's debugger permission behavior may affect
    operation.
-   The extension is intended for testing and personal use unless and
    until its distribution and policy requirements have been reviewed.

## Troubleshooting

**The extension does not appear to work** - Confirm it is enabled at
`chrome://extensions`. - Reload the extension after making code
changes. - Refresh the YouTube tab. - Check the extension's
service-worker and page console for errors.

**The skip control is not activated** - The ad may not be skippable yet,
or YouTube may have changed its interface. - Confirm that the current
selectors and coordinate handling still match the visible player
control.

## Contributing

When changing behavior, test both ad entry and ad exit, including
restoration of the video's prior mute and volume state. Avoid adding
permissions that are not essential.

## Distribution

Before publishing, review the current [Chrome Web Store Program
Policies](https://developer.chrome.com/docs/webstore/program-policies),
verify that the extension's behavior complies with applicable platform
terms and policies, prepare accurate listing information and privacy
disclosures, and test the packaged extension. Submission does not
guarantee approval.

## License

No license is specified yet. Add a `LICENSE` file before accepting
contributions or clearly stating reuse permissions.
