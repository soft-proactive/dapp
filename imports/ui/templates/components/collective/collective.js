import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

import './collective.html';

Template.collective.helpers({
  title() {
    return Meteor.settings.public.Collective.name;
  },
  description() {
    return Meteor.settings.public.Collective.profile.bio;
  },
  picture() {
    if (Meteor.settings.public.Collective.profile.logo) {
      return Meteor.settings.public.Collective.profile.logo;
    }
    return 'images/earth.png';
  },
  hasLogo() {
    return (Meteor.settings.public.Collective.profile.logo !== undefined);
  },
});
