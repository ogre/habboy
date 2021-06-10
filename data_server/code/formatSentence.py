#!/usr/bin/env python3

import string

"""
Sanitize sentence string.
Calc and verify CRC code.
"""


def _hex(Character):
    _hexTable = "0123456789ABCDEF"
    return _hexTable[Character]


def crc(i_str):
    CRC = 0xFFFF
    # xPolynomial = 0x1021;

    for i in range(len(i_str)):
        CRC ^= ord(i_str[i]) << 8
        for j in range(8):
            if CRC & 0x8000:
                CRC = (CRC << 1) ^ 0x1021
            else:
                CRC <<= 1

    result = ""
    result += _hex((CRC >> 12) & 15)
    result += _hex((CRC >> 8) & 15)
    result += _hex((CRC >> 4) & 15)
    result += _hex(CRC & 15)

    return result


def verifyCrc(i_sent):
    i_crc = i_sent[i_sent.rfind("*") + 1 :]
    sent = i_sent[: i_sent.rfind("*")]
    return i_crc == crc(sent)


def formatSentence(i_sent):
    if not i_sent:
        return []

    lines = i_sent.split("\n")
    result = []

    for l in lines:
        dollar_index = l.rfind("$")
        l = l[dollar_index + 1 :]

        star_index = l.find("*")
        if star_index == -1:
            continue
        l = l[: star_index + 5]

        sentence = l[:-5]
        crc = l[-4:]

        result.append(sentence + "*" + crc)

    return result

def sentenceToCallsign(i_sent):
    sentences = formatSentence(i_sent)
    if not sentences:
        return None
    sentence = sentences[-1]
    tokens = sentence.split(",")
    if tokens:
        return str(tokens[0])
    return None

def sentenceToId(i_sent):
    sentences = formatSentence(i_sent)
    if not sentences:
        return None
    sentence = sentences[-1]
    tokens = sentence.split(",")
    if len(tokens) > 1:
        return int(tokens[1])
    return None

def getData(i_sent):
    sentences = formatSentence(i_sent)
    if not sentences:
        return None
    sentence = sentences[-1]
    tokens = sentence.split(",")

    if not tokens:
        return None

    # remove callsign
    tokens = tokens[1:]

    # remove CRC
    tokens[-1] = tokens[-1][0 : tokens[-1].find("*")]
    return tokens


if __name__ == "__main__":
    s = formatSentence(
        "$$$fro3,2141,224553,52.09318,21.00429,127,0,0,0,0,D*5094 DESCEND"
    )[-1]
    print(s)
    print((sentenceToId(s)))
    print((getData(s)))
