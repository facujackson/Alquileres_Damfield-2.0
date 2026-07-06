import { publish } from 'gh-pages';

publish(
  'dist',
  {
    branch: 'gh-pages',
    repo: 'https://github.com/facujackson/Alquileres_Damfield-2.0.git',
    user: {
      name: 'Facu Jackson',
      email: 'facujackson@users.noreply.github.com',
    },
    dotfiles: true,
  },
  (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log('Published to GitHub Pages');
  }
);
