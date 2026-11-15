import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function DynamicFields({ scope, value, onChange }) {
  const [fields, setFields] = useState([])
  useEffect(() => {
    supabase.from('tn_form_fields').select('*').eq('scope', scope).eq('active', true)
      .order('sort').order('label').then(({ data }) => setFields(data || []))
  }, [scope])
  const set = (id, v) => onChange({ ...value, [id]: v })
  return fields.map(f => (
    <div key={f.id}>
      {f.kind === 'select' ? (
        <select value={value[f.id] || ''} onChange={e => set(f.id, e.target.value)} required={f.required}>
          <option value="">{f.label}{f.required ? ' *' : ''}</option>
          {(f.options || []).map(o => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input type={f.kind === 'number' ? 'number' : 'text'} placeholder={f.label + (f.required ? ' *' : '')}
          value={value[f.id] || ''} onChange={e => set(f.id, e.target.value)} required={f.required} />
      )}
    </div>
  ))
}