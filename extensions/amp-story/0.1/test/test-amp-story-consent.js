/**
 * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {AmpStoryConsent} from '../amp-story-consent';
import {AmpStoryStoreService, StateProperty} from '../amp-story-store-service';
import {registerServiceBuilder} from '../../../../src/service';

describes.realWin('amp-story-consent', {amp: true}, (env) => {
  const CONSENT_ID = 'CONSENT_ID';
  let win;
  let defaultConfig;
  let getComputedStyleStub;
  let storyConsent;
  let storyConsentConfigEl;
  let storyConsentEl;

  const setConfig = (config) => {
    storyConsentConfigEl.textContent = JSON.stringify(config);
  };

  beforeEach(() => {
    win = env.win;
    const storeService = new AmpStoryStoreService(win);
    registerServiceBuilder(win, 'story-store', function () {
      return storeService;
    });

    defaultConfig = {
      title: 'Foo title.',
      message: 'Foo message about the consent.',
      vendors: ['Item 1', 'Item 2'],
      onlyAccept: false,
      externalLink: {},
    };

    const styles = {'background-color': 'rgb(0, 0, 0)'};
    getComputedStyleStub = env.sandbox
      .stub(win, 'getComputedStyle')
      .returns(styles);

    // Test DOM structure:
    // <amp-consent>
    //   <amp-story-consent>
    //     <script type="application/json">{JSON Config}</script>
    //   </amp-story-consent>
    // </amp-consent>
    const consentEl = win.document.createElement('amp-consent');
    consentEl.setAttribute('id', CONSENT_ID);

    storyConsentConfigEl = win.document.createElement('script');
    storyConsentConfigEl.setAttribute('type', 'application/json');
    setConfig(defaultConfig);

    storyConsentEl = win.document.createElement('amp-story-consent');
    storyConsentEl.appendChild(storyConsentConfigEl);

    consentEl.appendChild(storyConsentEl);
    win.document.body.appendChild(consentEl);

    storyConsent = new AmpStoryConsent(storyConsentEl);
  });

  it('should parse the config', () => {
    storyConsent.buildCallback();
    expect(storyConsent.storyConsentConfig_).to.deep.equal(defaultConfig);
  });

  it('should require a story-consent title', () => {
    delete defaultConfig.title;
    setConfig(defaultConfig);

    allowConsoleError(() => {
      expect(() => {
        storyConsent.buildCallback();
      }).to.throw('config requires a title');
    });
  });

  it('should require a story-consent message', () => {
    delete defaultConfig.message;
    setConfig(defaultConfig);

    allowConsoleError(() => {
      expect(() => {
        storyConsent.buildCallback();
      }).to.throw('config requires a message');
    });
  });

  it('should require a story-consent vendors', () => {
    delete defaultConfig.vendors;
    setConfig(defaultConfig);

    allowConsoleError(() => {
      expect(() => {
        storyConsent.buildCallback();
      }).to.throw('config requires an array of vendors');
    });
  });

  it('should require a story-consent vendors of type array', () => {
    defaultConfig.vendors = 'foo';
    setConfig(defaultConfig);

    allowConsoleError(() => {
      expect(() => {
        storyConsent.buildCallback();
      }).to.throw('config requires an array of vendors');
    });
  });

  it('should require onlyAccept to be a boolean', () => {
    defaultConfig.onlyAccept = 'foo';
    setConfig(defaultConfig);

    allowConsoleError(() => {
      expect(() => {
        storyConsent.buildCallback();
      }).to.throw('config requires "onlyAccept" to be a boolean');
    });
  });

  it('should show the decline button by default', () => {
    delete defaultConfig.onlyAccept;
    setConfig(defaultConfig);

    storyConsent.buildCallback();

    const buttonEl = storyConsent.storyConsentEl_.querySelector(
      '.i-amphtml-story-consent-action-reject'
    );

    // For some reason the win object provided by the test environment does not
    // return all the styles.
    expect(buttonEl).to.have.display('block');
  });

  it('should hide the decline button if onlyAccept is true', () => {
    defaultConfig.onlyAccept = true;
    setConfig(defaultConfig);

    storyConsent.buildCallback();

    const buttonEl = storyConsent.storyConsentEl_.querySelector(
      '.i-amphtml-story-consent-action-reject'
    );

    // For some reason the win object provided by the test environment does not
    // return all the styles.
    expect(buttonEl).to.have.display('none');
  });

  it('should hide the external link by default', () => {
    storyConsent.buildCallback();

    const linkEl = storyConsent.storyConsentEl_.querySelector(
      '.i-amphtml-story-consent-external-link'
    );

    expect(linkEl).to.have.display('none');
  });

  it('should require an external link title if a URL is provided', () => {
    defaultConfig.externalLink.href = 'https://example.com';
    setConfig(defaultConfig);

    allowConsoleError(() => {
      expect(() => {
        storyConsent.buildCallback();
      }).to.throw('config requires "externalLink.title" to be a string');
    });
  });

  it('should require an external URL if a title is provided', () => {
    defaultConfig.externalLink.title = 'Privacy settings';
    setConfig(defaultConfig);

    allowConsoleError(() => {
      expect(() => {
        storyConsent.buildCallback();
      }).to.throw('config requires "externalLink.href" to be an absolute URL');
    });
  });

  it('should validate an external absolute URL', () => {
    defaultConfig.externalLink.title = 'Privacy settings';
    defaultConfig.externalLink.href = '/foo.html';
    setConfig(defaultConfig);

    allowConsoleError(() => {
      expect(() => {
        storyConsent.buildCallback();
      }).to.throw('URL must start with "http://" or "https://"');
    });
  });

  it('should show the external link', () => {
    defaultConfig.externalLink.title = 'Privacy settings';
    defaultConfig.externalLink.href = 'https://example.com';
    setConfig(defaultConfig);

    storyConsent.buildCallback();

    const linkEl = storyConsent.storyConsentEl_.querySelector(
      '.i-amphtml-story-consent-external-link'
    );

    expect(linkEl).not.to.have.display('none');
  });

  it('should allowlist the <amp-consent> actions', () => {
    const addToAllowlistStub = env.sandbox.stub(
      storyConsent.actions_,
      'addToAllowlist'
    );

    storyConsent.buildCallback();

    expect(addToAllowlistStub).to.have.callCount(3);
    expect(addToAllowlistStub).to.have.been.calledWith('AMP-CONSENT', 'accept');
    expect(addToAllowlistStub).to.have.been.calledWith('AMP-CONSENT', 'prompt');
    expect(addToAllowlistStub).to.have.been.calledWith('AMP-CONSENT', 'reject');
  });

  it('should broadcast the amp actions', () => {
    env.sandbox.stub(storyConsent.actions_, 'trigger');

    storyConsent.buildCallback();

    // Builds and appends a fake button directly in the storyConsent Shadow DOM.
    const buttonEl = win.document.createElement('button');
    buttonEl.setAttribute('on', 'tap:ABC.accept');
    storyConsent.storyConsentEl_.appendChild(buttonEl);

    const clickEvent = new Event('click');
    buttonEl.dispatchEvent(clickEvent);

    expect(storyConsent.actions_.trigger).to.have.been.calledOnce;
    expect(storyConsent.actions_.trigger).to.have.been.calledWith(buttonEl);
  });

  it('should render an accept button with the proper amp action', () => {
    storyConsent.buildCallback();

    const buttonEl = storyConsent.storyConsentEl_.querySelector(
      `button[on="tap:${CONSENT_ID}.accept"]`
    );
    expect(buttonEl).to.exist;
  });

  it('should set the consent ID in the store', () => {
    storyConsent.buildCallback();

    expect(storyConsent.storeService_.get(StateProperty.CONSENT_ID)).to.equal(
      CONSENT_ID
    );
  });

  it('should set the font color to black if background is white', () => {
    const styles = {'background-color': 'rgb(255, 255, 255)'};
    getComputedStyleStub.returns(styles);
    storyConsent.buildCallback();

    const buttonEl = storyConsent.storyConsentEl_.querySelector(
      '.i-amphtml-story-consent-action-accept'
    );
    expect(buttonEl.getAttribute('style')).to.equal(
      'color: rgb(0, 0, 0) !important;'
    );
  });

  it('should set the font color to white if background is black', () => {
    const styles = {'background-color': 'rgba(0, 0, 0, 1)'};
    getComputedStyleStub.returns(styles);
    storyConsent.buildCallback();

    const buttonEl = storyConsent.storyConsentEl_.querySelector(
      '.i-amphtml-story-consent-action-accept'
    );
    expect(buttonEl.getAttribute('style')).to.equal(
      'color: rgb(255, 255, 255) !important;'
    );
  });
});
