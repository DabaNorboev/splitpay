import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('PUT RECEIVED:', JSON.stringify(body, null, 2))
    const { crmItemId, ...fields } = body
    
    if (!crmItemId) {
      return NextResponse.json({ success: false, error: 'crmItemId is required' }, { status: 400 })
    }
    
    const bitrixPayload: {
      entityTypeId: number;
      id: number;
      fields: Record<string, string | number>;
    } = {
      entityTypeId: 1042,
      id: crmItemId,
      fields: {}
    }

    // Обновляем только переданные поля
    if (fields.totalAmount !== undefined) {
      bitrixPayload.fields["ufCrm7_1776802599"] = Number(fields.totalAmount)
    }
    if (fields.memberCount !== undefined) {
      bitrixPayload.fields["ufCrm7_1776802683"] = Number(fields.memberCount)
    }
    if (fields.lastActivity !== undefined) {
      bitrixPayload.fields["ufCrm7_1776803316"] = formatDateForBitrix(fields.lastActivity)
    }
    
    const webhookUrl = 'https://b24-4q9b0h.bitrix24.ru/rest/1/3pa1n3tczmw3gipg/crm.item.update.json'
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bitrixPayload)
    })
    
    const result = await response.json()
    
    if (result.error) {
      console.error('Bitrix update error:', result.error)
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
    
    return NextResponse.json({ success: true, data: result })
    
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const bitrixPayload = {
      entityTypeId: 1042,
      fields: {
        // ID группы (строка, обязательное)
        "ufCrm7_1776801974": String(body.groupId),
        
        // Название группы (строка, обязательное)
        "ufCrm7_1776802708": String(body.groupName),
        
        // Организатор (строка, обязательное)
        "ufCrm7_1776856604": String(body.ownerName),
        
        // Дата создания (datetime, обязательное) - формат: YYYY-MM-DD HH:MM:SS
        "ufCrm7_1776802834": formatDateForBitrix(body.createdAt),
        
        // Количество участников (число)
        "ufCrm7_1776802683": Number(body.memberCount) || 1,
        
        // Общая сумма расходов (money) - число с точкой
        "ufCrm7_1776802599": Number(body.totalAmount) || 0,
        
        // Дата последней активности (datetime)
        "ufCrm7_1776803316": formatDateForBitrix(body.lastActivity)
      }
    }

    console.log('Bitrix payload:', JSON.stringify(bitrixPayload, null, 2))

    const webhookUrl = 'https://b24-4q9b0h.bitrix24.ru/rest/1/3pa1n3tczmw3gipg/crm.item.add.json'
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bitrixPayload)
    })

    const result = await response.json()
    
    if (result.error) {
      console.error('Bitrix error:', result.error)
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
    
    console.log('Bitrix success:', result.result.item.id)
    return NextResponse.json({ success: true, data: result })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}



// Формат для Bitrix datetime: YYYY-MM-DD HH:MM:SS
function formatDateForBitrix(isoString: string): string {
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}