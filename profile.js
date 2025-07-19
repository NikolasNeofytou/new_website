(function(){
  const e = React.createElement;

  function ProfileApp(){
    const [user, setUser] = React.useState(null);
    const [message, setMessage] = React.useState('');

    React.useEffect(() => {
      const stored = localStorage.getItem('currentUser');
      if(!stored) return;
      const info = JSON.parse(stored);
      fetch('/api/users/' + encodeURIComponent(info.univid))
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if(data) setUser(data);
        });
    }, []);

    function handleChange(e){
      const {name, value} = e.target;
      setUser({...user, [name]: value});
    }

    function handlePhoto(e){
      const file = e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = () => setUser(u => ({...u, photo: reader.result}));
      reader.readAsDataURL(file);
    }

    async function save(){
      await fetch('/api/users/' + user.univid, {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(user)
      });
      localStorage.setItem('currentUser', JSON.stringify(user));
      if(window.updateUserInfo) window.updateUserInfo();
      setMessage('Saved!');
    }

    if(!user) return e('p', null, 'No user logged in.');
    return e('div', null,
      e('div', {className:'mb-3'}, [
        e('label',{className:'form-label', htmlFor:'name'},'Name'),
        e('input',{id:'name', name:'name', className:'form-control', value:user.name, onChange:handleChange})
      ]),
      e('div', {className:'mb-3'}, [
        e('label',{className:'form-label', htmlFor:'year'},'Year'),
        e('input',{id:'year', name:'year', className:'form-control', value:user.year, onChange:handleChange})
      ]),
      e('div', {className:'mb-3'}, [
        e('label',{className:'form-label', htmlFor:'spec'},'Specialisation'),
        e('input',{id:'spec', name:'spec', className:'form-control', value:user.spec, onChange:handleChange})
      ]),
      e('div', {className:'mb-3'}, [
        e('label',{className:'form-label', htmlFor:'photo'},'Photo'),
        e('input',{id:'photo', type:'file', onChange:handlePhoto, className:'form-control'})
      ]),
      user.photo ? e('img',{src:user.photo, alt:'', className:'rounded mb-3', style:{width:'100px',height:'100px'}}) : null,
      e('div', {className:'mb-3'}, [
        e('label',{className:'form-label', htmlFor:'about'},'About'),
        e('textarea',{id:'about', name:'about', className:'form-control', rows:3, value:user.about||'', onChange:handleChange})
      ]),
      e('button',{className:'btn btn-primary', onClick:save},'Save'),
      message && e('p',{className:'mt-2 text-success'},message)
    );
  }

  ReactDOM.render(e(ProfileApp), document.getElementById('profile-root'));
})();
